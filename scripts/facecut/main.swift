// facecut — cut the PERSON out of a player photo. Apple Vision, offline, free.
//
//   swiftc -O -o /tmp/facecut scripts/facecut/main.swift
//   /tmp/facecut <in.jpg> <out.png> [size]
//
// WHY. The eyes-on survey of the top-5 builders showed the entire gap to
// FotMob is BACKGROUND NOISE: their headshots are cutouts on a clean ground,
// ours are match photos with stadiums behind them. Segmentation closes that
// gap using our own licensed Commons photos — a derivative of a CC BY /
// CC BY-SA work is permitted WITH attribution and a note of modification.
//
// ⚠️ INSTANCE MASK, NOT BLANKET PERSON SEGMENTATION. A match photo often has a
// team-mate in frame (Mainoo's card showed two players). Blanket person
// segmentation keeps every human; the instance mask labels them separately,
// and the instance UNDER THE LARGEST FACE is the subject. Only that instance
// survives.
//
// ⚠️ VISION AND COREIMAGE BOTH USE BOTTOM-LEFT ORIGINS, so unlike the CSS path
// there is NO y-flip here. Flipping out of habit puts the crop on the shins.
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

let args = CommandLine.arguments
guard args.count >= 3 else { fputs("usage: facecut <in> <out.png> [size]\n", stderr); exit(2) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let outSize = args.count > 3 ? (Int(args[3]) ?? 512) : 512

guard let src = CIImage(contentsOf: inURL) else { fputs("unreadable\n", stderr); exit(1) }
let handler = VNImageRequestHandler(ciImage: src, options: [:])

// 1. The subject is the largest face.
let faceReq = VNDetectFaceRectanglesRequest()
do { try handler.perform([faceReq]) } catch { fputs("face request failed: \(error)\n", stderr); exit(1) }
guard let face = (faceReq.results ?? []).max(by: {
  $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height
}) else { fputs("no face\n", stderr); exit(3) }
let fb = face.boundingBox                      // normalised, bottom-left origin

// 2. Foreground instances; keep the one under the face centre.
let maskReq = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([maskReq]) } catch { fputs("mask request failed: \(error)\n", stderr); exit(1) }
guard let obs = maskReq.results?.first else { fputs("no foreground instances\n", stderr); exit(4) }

var chosen = obs.allInstances
let labelBuf = obs.instanceMask
CVPixelBufferLockBaseAddress(labelBuf, .readOnly)
if let base = CVPixelBufferGetBaseAddress(labelBuf) {
  let lw = CVPixelBufferGetWidth(labelBuf)
  let lh = CVPixelBufferGetHeight(labelBuf)
  let rowBytes = CVPixelBufferGetBytesPerRow(labelBuf)
  // The label buffer is TOP-LEFT origin (a plain pixel buffer), the face box is
  // bottom-left normalised — hence the (1 - y) here and nowhere else.
  let px = min(lw - 1, max(0, Int(fb.midX * CGFloat(lw))))
  let py = min(lh - 1, max(0, Int((1 - fb.midY) * CGFloat(lh))))
  let label = base.assumingMemoryBound(to: UInt8.self)[py * rowBytes + px]
  if label > 0 { chosen = IndexSet(integer: Int(label)) }
}
CVPixelBufferUnlockBaseAddress(labelBuf, .readOnly)

guard let maskPB = try? obs.generateScaledMaskForImage(forInstances: chosen, from: handler) else {
  fputs("mask generation failed\n", stderr); exit(4)
}

// 3. Keep only the subject; everything else becomes transparent.
let blend = CIFilter.blendWithMask()
blend.inputImage = src
blend.backgroundImage = CIImage(color: .clear).cropped(to: src.extent)
blend.maskImage = CIImage(cvPixelBuffer: maskPB)
guard let cut = blend.outputImage else { fputs("blend failed\n", stderr); exit(1) }

// 4. Face-centred square crop.
// ⚠️ VISION'S FACE BOX STOPS AT THE HAIRLINE — it covers brow to chin and
// EXCLUDES hair. The first cut placed the crop centre BELOW the face for an
// "eyes above centre" look, which guillotined Ødegaard's and Gyökeres's hair.
// The crop centre now sits slightly ABOVE the face centre, giving ~29% of the
// frame as headroom above the brow line, and the face share drops 0.42 → 0.38
// so tall hair fits inside the square.
let W = src.extent.width, H = src.extent.height
let faceW = fb.width * W
let side = min(max(faceW / 0.38, faceW * 1.6), min(W, H))
let cx = fb.midX * W
let cy = fb.midY * H + side * 0.04             // face slightly LOW in frame = hair headroom
let rect = CGRect(x: cx - side / 2, y: cy - side / 2, width: side, height: side)

// ⚠️ DO NOT SLIDE THE CROP BACK INSIDE THE PHOTO. This used to clamp the rect
// into the source extent, which sounds harmless and is the single biggest
// quality defect in the whole pipeline. When a face sits near the top of its
// photo — which is most match-day portraits — the wanted crop pokes above the
// frame, the clamp slid it DOWN until flush, and every pixel of the intended
// headroom vanished. The subject then touches row 0 of the cutout and renders
// as a flat-topped head jammed against the disc.
// MEASURED 2026-08-13 across 4,339 cutouts: 964 (22.2%) had the subject on the
// top row and another 319 within 2% of it — 29.6% of the pool, Carrick and
// Evra among them. No render-side clamp can undo it, because the pixels were
// never in the file.
// Letting the rect run past the edge and compositing over a transparent square
// keeps the framing the face asked for and pads the overflow with nothing,
// which is exactly right for a cutout: empty space above a head, instead of a
// head with its crown shaved off. The explicit frame also keeps the output
// square — cropped(to:) alone returns only the intersection, which would emit
// a non-square PNG and silently break every normalised box in meta.json.
let scale = CGFloat(outSize) / side
let frame = CGRect(x: 0, y: 0, width: CGFloat(outSize), height: CGFloat(outSize))
let out = cut.cropped(to: rect)
  .transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
  .transformed(by: CGAffineTransform(scaleX: scale, y: scale))
  .composited(over: CIImage(color: .clear).cropped(to: frame))
  .cropped(to: frame)

let ctx = CIContext()
do {
  try ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8,
    colorSpace: CGColorSpaceCreateDeviceRGB())
} catch { fputs("write failed: \(error)\n", stderr); exit(1) }
// ⚠️ RESIDUAL-FACE CHECK. Overlapping players can merge into ONE Vision
// instance (Mainoo's cutout still carried a team-mate). Re-detect faces on the
// finished cutout: more than one means the cut is dirty, and the caller should
// prefer a different photo. Reported, not fatal — a flagged cutout still beats
// nothing while the re-pick hunts a better source.
var residual = 1
if let cg = ctx.createCGImage(out, from: out.extent) {
  let checkReq = VNDetectFaceRectanglesRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([checkReq])
  residual = (checkReq.results ?? []).count
}
print("ok \(Int(side))px crop, face \(Int(faceW))px, instances kept: \(chosen.count), faces in cutout: \(residual)")
