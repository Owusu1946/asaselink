import { z } from "zod";

const positionSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);

const ringSchema = z.array(positionSchema).min(4).superRefine((ring, context) => {
  const first = ring[0];
  const last = ring.at(-1);
  if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
    context.addIssue({ code: "custom", message: "Polygon rings must be closed." });
  }
});

export const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(ringSchema).min(1),
});

export const estateGeometrySchema = z.union([
  polygonSchema,
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(ringSchema).min(1)).min(1) }),
]);

export type PolygonInput = z.infer<typeof polygonSchema>;
export type EstateGeometryInput = z.infer<typeof estateGeometrySchema>;

export function asMultiPolygon(geometry: EstateGeometryInput) {
  return geometry.type === "MultiPolygon"
    ? geometry
    : { type: "MultiPolygon" as const, coordinates: [geometry.coordinates] };
}
