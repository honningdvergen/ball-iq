// portrait — the face measures a Mystery Player photo is judged on, via
// Apple's Vision, offline (Job A follow-up, 26 Nov 2026).
//
//   swiftc -O -o <dir>/portrait scripts/facebox/portrait.swift
//   <dir>/portrait img1.jpg img2.jpg ...      # NDJSON, one row per image
//
// Per image: how many faces, and for the LARGEST face its box (top-left
// origin, fractions), Vision's roll / yaw / pitch in degrees (face-rectangles
// revision 3 reports them as continuous angles), the face capture quality
// (Vision's own 0-1 score of pose, focus and light), and from the landmarks
// the two eye centres and the nose tip (fractions of the picture). Nothing
// here says who anyone is: it measures a pose and a picture.
//
// scripts/facebox/main.swift is unchanged; the lineup builder uses it.
import Foundation
import Vision
import CoreImage

struct P: Encodable { let x: Double; let y: Double }
struct Row: Encodable {
  let file: String
  let ok: Bool
  let faces: Int
  let x: Double?, y: Double?, w: Double?, h: Double?
  let conf: Float?
  let roll: Double?, yaw: Double?, pitch: Double?
  let quality: Float?
  let leftEye: P?, rightEye: P?, nose: P?
  let err: String?
}
let enc = JSONEncoder()
func emit(_ r: Row) { if let d = try? enc.encode(r), let s = String(data: d, encoding: .utf8) { print(s) } }
func deg(_ n: NSNumber?) -> Double? { n.map { $0.doubleValue * 180.0 / Double.pi } }

for path in CommandLine.arguments.dropFirst() {
  guard let img = CIImage(contentsOf: URL(fileURLWithPath: path)) else {
    emit(Row(file: path, ok: false, faces: 0, x: nil, y: nil, w: nil, h: nil, conf: nil, roll: nil, yaw: nil, pitch: nil, quality: nil, leftEye: nil, rightEye: nil, nose: nil, err: "unreadable")); continue
  }
  let rect = VNDetectFaceRectanglesRequest()
  if #available(macOS 12.0, *) { rect.revision = VNDetectFaceRectanglesRequestRevision3 }
  let handler = VNImageRequestHandler(ciImage: img, options: [:])
  do { try handler.perform([rect]) } catch {
    emit(Row(file: path, ok: false, faces: 0, x: nil, y: nil, w: nil, h: nil, conf: nil, roll: nil, yaw: nil, pitch: nil, quality: nil, leftEye: nil, rightEye: nil, nose: nil, err: "\(error)")); continue
  }
  let obs = rect.results ?? []
  guard let best = obs.max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }) else {
    emit(Row(file: path, ok: false, faces: 0, x: nil, y: nil, w: nil, h: nil, conf: nil, roll: nil, yaw: nil, pitch: nil, quality: nil, leftEye: nil, rightEye: nil, nose: nil, err: "no face")); continue
  }
  let marks = VNDetectFaceLandmarksRequest(); marks.inputFaceObservations = [best]
  let qual = VNDetectFaceCaptureQualityRequest(); qual.inputFaceObservations = [best]
  try? handler.perform([marks, qual])
  let lm = (marks.results?.first)?.landmarks
  let q = qual.results?.first?.faceCaptureQuality
  let b = best.boundingBox
  // A landmark region's points are normalised to the FACE box; turn its mean
  // into picture fractions with a top-left origin.
  func centre(_ r: VNFaceLandmarkRegion2D?) -> P? {
    guard let r = r, r.pointCount > 0 else { return nil }
    let pts = r.normalizedPoints
    var sx = 0.0, sy = 0.0
    for p in pts { sx += Double(p.x); sy += Double(p.y) }
    let mx = sx / Double(pts.count), my = sy / Double(pts.count)
    return P(x: Double(b.origin.x) + mx * Double(b.width), y: 1.0 - (Double(b.origin.y) + my * Double(b.height)))
  }
  var pitch: Double? = nil
  if #available(macOS 12.0, *) { pitch = deg(best.pitch) }
  emit(Row(file: path, ok: true, faces: obs.count,
           x: Double(b.origin.x), y: 1.0 - Double(b.origin.y) - Double(b.height), w: Double(b.width), h: Double(b.height),
           conf: best.confidence, roll: deg(best.roll), yaw: deg(best.yaw), pitch: pitch, quality: q,
           leftEye: centre(lm?.leftEye), rightEye: centre(lm?.rightEye), nose: centre(lm?.nose), err: nil))
}
