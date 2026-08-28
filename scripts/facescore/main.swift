// facescore — measure how FotMob-like a player photo is. Apple Vision, offline.
//
//   swiftc -O -o /tmp/facescore scripts/facescore/main.swift
//   /tmp/facescore <image> [image…]      → one JSON line per image
//
// WHY. Alex, 2026-08-28, looking at FotMob next to ours: "the fotmob ones are
// standardized, whole face, same crop, same feel of EVERY SINGLE PHOTO. we
// need that as well." We cannot reshoot anyone, but three of their photo
// characteristics are MEASURABLE, and what is measurable can be gated:
//
//   yaw    — head turned left/right. Their photos: ~0. A profile shot ("you
//            only see one side of the face") scores high and fails the gate.
//   pitch  — head up/down. Timber-looking-at-his-boots fails here.
//   roll   — head tilt. Cheap to read while we are here.
//   sharp  — variance of the Laplacian over the face crop's luminance. Low =
//            soft/blurred source or an upscale.
//   bright — mean luminance of the face crop. Catches faces lost in shadow.
//   faceShare — face box width / image width. Tiny faces upscale to mush.
//
// Output feeds a ranking, not an auto-delete: the standing rule is that the
// eyeball pass decides. This tool exists so the eyeball pass reads a sorted
// worst-first sheet instead of 4,000 unsorted thumbnails.
import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count >= 2 else { fputs("usage: facescore <image> [image…]\n", stderr); exit(2) }

let ctx = CIContext(options: [.workingColorSpace: NSNull()])

func luminancePixels(_ image: CIImage, side: Int) -> [Float]? {
  // Downscale to a fixed side so sharpness numbers are comparable across
  // sources — variance of a gradient is resolution-dependent otherwise.
  let sx = CGFloat(side) / image.extent.width
  let sy = CGFloat(side) / image.extent.height
  let small = image.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
  guard let cg = ctx.createCGImage(small, from: CGRect(x: 0, y: 0, width: side, height: side)) else { return nil }
  guard let data = cg.dataProvider?.data as Data? else { return nil }
  let bpp = cg.bitsPerPixel / 8
  var out = [Float](repeating: 0, count: side * side)
  data.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
    let p = raw.bindMemory(to: UInt8.self)
    for y in 0..<side {
      for x in 0..<side {
        let i = y * cg.bytesPerRow + x * bpp
        if i + 2 < p.count {
          // Rec. 601 luma; channel order differences shift constants a little,
          // which is fine — the numbers only ever compare against each other.
          out[y * side + x] = 0.299 * Float(p[i]) + 0.587 * Float(p[i + 1]) + 0.114 * Float(p[i + 2])
        }
      }
    }
  }
  return out
}

for path in args.dropFirst() {
  let url = URL(fileURLWithPath: path)
  guard let ci = CIImage(contentsOf: url) else {
    print("{\"file\":\"\(url.lastPathComponent)\",\"error\":\"unreadable\"}"); continue
  }
  let req = VNDetectFaceLandmarksRequest()
  let handler = VNImageRequestHandler(ciImage: ci, options: [:])
  do { try handler.perform([req]) } catch {
    print("{\"file\":\"\(url.lastPathComponent)\",\"error\":\"vision\"}"); continue
  }
  let faces = req.results ?? []
  guard let face = faces.max(by: { $0.boundingBox.width < $1.boundingBox.width }) else {
    print("{\"file\":\"\(url.lastPathComponent)\",\"faces\":0}"); continue
  }
  let bb = face.boundingBox  // normalized, bottom-left origin
  let W = ci.extent.width, H = ci.extent.height
  let crop = CGRect(x: bb.minX * W, y: bb.minY * H, width: bb.width * W, height: bb.height * H)
  // cropped(to:) keeps the ORIGINAL coordinate extent — translate to origin or
  // the later scale-and-read samples empty space and every cutout reads black.
  let faceImg = ci.cropped(to: crop).transformed(by: CGAffineTransform(translationX: -crop.minX, y: -crop.minY))

  var sharp = 0.0, bright = 0.0
  if let px = luminancePixels(faceImg, side: 64) {
    let n = 64
    bright = Double(px.reduce(0, +)) / Double(px.count)
    // 4-neighbour Laplacian variance.
    var lap = [Float]()
    lap.reserveCapacity((n - 2) * (n - 2))
    for y in 1..<(n - 1) {
      for x in 1..<(n - 1) {
        let c = px[y * n + x]
        lap.append(px[(y - 1) * n + x] + px[(y + 1) * n + x] + px[y * n + x - 1] + px[y * n + x + 1] - 4 * c)
      }
    }
    let mean = lap.reduce(0, +) / Float(lap.count)
    sharp = Double(lap.reduce(0) { $0 + ($1 - mean) * ($1 - mean) } / Float(lap.count))
  }

  func deg(_ v: NSNumber?) -> Double { v.map { $0.doubleValue * 180 / .pi } ?? .nan }
  let yaw = deg(face.yaw), roll = deg(face.roll)
  var pitch = Double.nan
  if #available(macOS 12.0, *) { pitch = deg(face.pitch) }

  var o: [String] = []
  o.append("\"file\":\"\(url.lastPathComponent)\"")
  o.append("\"faces\":\(faces.count)")
  o.append("\"yaw\":\(yaw.isNaN ? "null" : String(format: "%.1f", yaw))")
  o.append("\"pitch\":\(pitch.isNaN ? "null" : String(format: "%.1f", pitch))")
  o.append("\"roll\":\(roll.isNaN ? "null" : String(format: "%.1f", roll))")
  o.append("\"faceShare\":\(String(format: "%.3f", bb.width))")
  o.append("\"sharp\":\(String(format: "%.1f", sharp))")
  o.append("\"bright\":\(String(format: "%.1f", bright))")
  print("{" + o.joined(separator: ",") + "}")
}
