// facebox — offline face detection for player portraits, via Apple's Vision.
//
//   swiftc -O -o /tmp/facebox scripts/facebox/main.swift
//   /tmp/facebox img1.jpg img2.jpg ...        # NDJSON on stdout, one row per image
//
// WHY THIS EXISTS. Commons portraits are framed arbitrarily — some are tight
// head shots, most are half-body match photos, a few are the player at the far
// end of a pitch. A lineup builder needs them to look like one set of cards,
// which means a consistent head-and-shoulders crop, which means knowing where
// the face actually is.
//
// WHY LOCAL AND NOT A SERVICE. Vision ships with macOS, runs offline, costs
// nothing and sends no player photos to a third party. Xcode is already a
// dependency of this repo for the iOS build, so it adds nothing new.
//
// ⚠️ OUTPUT IS A BOX, NOT AN IMAGE. Deliberately: the crop is applied in CSS at
// render time from the Commons-hosted file. Cropping to disk would mean
// self-hosting thousands of derivative images — bundle weight, and a
// re-derivative of a CC BY-SA work that then needs its own attribution chain.
// Four numbers per player re-frame for free.
//
// ⚠️ VISION'S COORDINATE SPACE IS BOTTOM-LEFT ORIGIN, normalised 0-1. CSS is
// top-left. The y flip below is not optional and is silent if wrong — the crop
// simply lands on the player's shins and still looks like "a photo".
import Foundation
import Vision
import CoreImage

struct Row: Encodable {
  let file: String
  let ok: Bool
  let x: Double?, y: Double?, w: Double?, h: Double?   // face box, top-left origin
  let conf: Float?
  let faces: Int
  let err: String?
}

let enc = JSONEncoder()
func emit(_ r: Row) {
  if let d = try? enc.encode(r), let s = String(data: d, encoding: .utf8) { print(s) }
}

for path in CommandLine.arguments.dropFirst() {
  guard let img = CIImage(contentsOf: URL(fileURLWithPath: path)) else {
    emit(Row(file: path, ok: false, x: nil, y: nil, w: nil, h: nil, conf: nil, faces: 0,
             err: "unreadable")); continue
  }
  let req = VNDetectFaceRectanglesRequest()
  do {
    try VNImageRequestHandler(ciImage: img, options: [:]).perform([req])
  } catch {
    emit(Row(file: path, ok: false, x: nil, y: nil, w: nil, h: nil, conf: nil, faces: 0,
             err: "\(error)")); continue
  }
  let obs = req.results ?? []
  // ⚠️ PICK THE LARGEST FACE, NOT THE FIRST. Match photos routinely include
  // opponents, team-mates and crowd faces; Vision returns them in no useful
  // order. The subject of a portrait is essentially always the biggest face,
  // and "first" would silently crop to a steward in the background.
  guard let best = obs.max(by: { $0.boundingBox.width * $0.boundingBox.height
                               < $1.boundingBox.width * $1.boundingBox.height }) else {
    emit(Row(file: path, ok: false, x: nil, y: nil, w: nil, h: nil, conf: nil,
             faces: 0, err: "no face")); continue
  }
  let b = best.boundingBox
  emit(Row(file: path, ok: true,
           x: b.origin.x, y: 1.0 - b.origin.y - b.height,   // flip to top-left origin
           w: b.width, h: b.height,
           conf: best.confidence, faces: obs.count, err: nil))
}
