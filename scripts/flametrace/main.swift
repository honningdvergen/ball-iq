// flametrace — extract the FLAME from the current app icon as flat poster
// layers, so the upgrade keeps the exact silhouette users recognise.
//
//   swiftc -O -o /tmp/flametrace scripts/flametrace/main.swift
//   /tmp/flametrace assets/icon.png /tmp/flame_outer.png /tmp/flame_inner.png
//
// The current icon's fire is a particle blaze — the "AI slop" tell. But its
// overall SHAPE is the thing 23 installed users see on their home screen.
// Tracing keeps the shape and discards the noise: small sparks vanish in the
// morphological open, the tongues survive, and the result is flattened to two
// solid oranges. Poster fire, same fire.
import Foundation
import CoreImage
import CoreImage.CIFilterBuiltins
import CoreGraphics

let args = CommandLine.arguments
guard args.count >= 4 else { fputs("usage: flametrace <icon> <outer.png> <inner.png>\n", stderr); exit(2) }
guard let src = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else { fputs("unreadable\n", stderr); exit(1) }
let ctx = CIContext()
let W = Int(src.extent.width), H = Int(src.extent.height)

// Read pixels once on the CPU for classification + ball measurement.
guard let cg = ctx.createCGImage(src, from: src.extent) else { exit(1) }
var buf = [UInt8](repeating: 0, count: W * H * 4)
let cs = CGColorSpaceCreateDeviceRGB()
guard let bctx = CGContext(data: &buf, width: W, height: H, bitsPerComponent: 8,
  bytesPerRow: W * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(1) }
bctx.draw(cg, in: CGRect(x: 0, y: 0, width: W, height: H))

// Two masks: all fire (outer), bright core (inner). Fire = strong red
// dominance; the core is the near-yellow heart of each tongue.
var outer = [UInt8](repeating: 0, count: W * H)
var inner = [UInt8](repeating: 0, count: W * H)
var minX = W, maxX = 0, minY = H, maxY = 0
for y in 0..<H {
  for x in 0..<W {
    let i = (y * W + x) * 4
    let r = Int(buf[i]), g = Int(buf[i+1]), b = Int(buf[i+2])
    if r > 140 && r * 10 > g * 14 && g * 10 > b * 11 {          // orange fire
      outer[y * W + x] = 255
      if r > 220 && g > 130 { inner[y * W + x] = 255 }           // bright core
    }
    if r > 190 && g > 190 && b > 190 &&                          // ball white
       abs(r - g) < 30 && abs(g - b) < 30 {
      if x < minX { minX = x }; if x > maxX { maxX = x }
      if y < minY { minY = y }; if y > maxY { maxY = y }
    }
  }
}
// Ball bbox in TOP-LEFT coords for the compositor (CG drew top-left here).
print("BALL {\"cx\": \(Double(minX + maxX) / 2), \"cy\": \(Double(minY + maxY) / 2), \"r\": \(Double(max(maxX - minX, maxY - minY)) / 2)}")

func maskImage(_ m: [UInt8]) -> CIImage {
  var mm = m
  let data = Data(bytes: &mm, count: W * H)
  let gcs = CGColorSpaceCreateDeviceGray()
  let provider = CGDataProvider(data: data as CFData)!
  let img = CGImage(width: W, height: H, bitsPerComponent: 8, bitsPerPixel: 8,
    bytesPerRow: W, space: gcs, bitmapInfo: CGBitmapInfo(rawValue: 0),
    provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)!
  return CIImage(cgImage: img)
}

// open (kills sparks) -> close (merges tongues) -> blur+threshold (smooths)
func clean(_ m: CIImage, openR: Float, closeR: Float, blurR: Double) -> CIImage {
  var img = m
  let mn = CIFilter.morphologyMinimum(); mn.inputImage = img; mn.radius = openR
  img = mn.outputImage!
  let mx = CIFilter.morphologyMaximum(); mx.inputImage = img; mx.radius = openR + closeR
  img = mx.outputImage!
  let mn2 = CIFilter.morphologyMinimum(); mn2.inputImage = img; mn2.radius = closeR
  img = mn2.outputImage!
  let bl = CIFilter.gaussianBlur(); bl.inputImage = img; bl.radius = Float(blurR)
  img = bl.outputImage!
  let th = CIFilter.colorThreshold(); th.inputImage = img; th.threshold = 0.45
  return th.outputImage!.cropped(to: m.extent)
}

func flat(_ mask: CIImage, hex: (CGFloat, CGFloat, CGFloat), out: String) {
  let color = CIImage(color: CIColor(red: hex.0, green: hex.1, blue: hex.2)).cropped(to: mask.extent)
  let blend = CIFilter.blendWithMask()
  blend.inputImage = color
  blend.backgroundImage = CIImage(color: .clear).cropped(to: mask.extent)
  blend.maskImage = mask
  try! ctx.writePNGRepresentation(of: blend.outputImage!, to: URL(fileURLWithPath: out),
    format: .RGBA8, colorSpace: cs)
}

flat(clean(maskImage(outer), openR: 5, closeR: 16, blurR: 9), hex: (1.0, 0.478, 0.102), out: args[2])   // #FF7A1A
flat(clean(maskImage(inner), openR: 4, closeR: 12, blurR: 7), hex: (1.0, 0.690, 0.125), out: args[3])   // #FFB020
print("done")
