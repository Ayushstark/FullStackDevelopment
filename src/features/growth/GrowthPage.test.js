import { describe, expect, it } from "vitest";
import { computeLayout, MINDMAP_CONFIG } from "./GrowthPage.jsx";

describe("growth mind map geometry", () => {
  it("returns deterministic positions and evenly spaced platform slots", () => {
    const first = computeLayout();
    const second = computeLayout();
    expect([...first.nodes]).toEqual([...second.nodes]);
    expect(first.ports.map(({ angle }) => angle)).toEqual([-90, -18, 54, 126, 198]);
  });

  it("keeps each port and platform on the same fixed radial slot", () => {
    const layout = computeLayout();
    for (const port of layout.ports) {
      const node = layout.nodes.get(port.id);
      const portDistance = Math.hypot(port.cx - layout.hub.cx, port.cy - layout.hub.cy);
      const nodeDistance = Math.hypot(node.cx - layout.hub.cx, node.cy - layout.hub.cy);
      expect(portDistance).toBeCloseTo(MINDMAP_CONFIG.slotRadius, 8);
      expect(nodeDistance).toBeCloseTo(MINDMAP_CONFIG.slotRadius, 8);
      expect(port.angle).toBe(node.angle);
      expect(node.r).toBe(MINDMAP_CONFIG.platformRadius);
      expect(node.r).toBeLessThan(layout.hub.r);
    }
  });

  it("attaches every edge to the exact hub and platform boundaries", () => {
    const layout = computeLayout();
    for (const platform of MINDMAP_CONFIG.platforms) {
      const node = layout.nodes.get(platform.id);
      const edge = layout.edges.get(platform.id);
      const direction = { x: Math.cos((node.angle * Math.PI) / 180), y: Math.sin((node.angle * Math.PI) / 180) };
      const expectedStart = { x: layout.hub.cx + direction.x * layout.hub.r, y: layout.hub.cy + direction.y * layout.hub.r };
      const expectedEnd = { x: node.cx - direction.x * node.r, y: node.cy - direction.y * node.r };
      expect(Math.hypot(edge.p0.x - expectedStart.x, edge.p0.y - expectedStart.y)).toBeLessThanOrEqual(0.5);
      expect(Math.hypot(edge.p3.x - expectedEnd.x, edge.p3.y - expectedEnd.y)).toBeLessThanOrEqual(0.5);
      expect([edge.p0.x, edge.p0.y, edge.p1.x, edge.p1.y, edge.p2.x, edge.p2.y, edge.p3.x, edge.p3.y].every(Number.isFinite)).toBe(true);
    }
  });

  it.each([1, 2, 6])("lays out %i fixed slots without invalid coordinates", (count) => {
    const config = {
      ...MINDMAP_CONFIG,
      platforms: Array.from({ length: count }, (_, index) => ({ id: `p${index}`, color: "#38bdf8", label: `Platform ${index}` })),
    };
    const layout = computeLayout(config);
    expect(layout.ports).toHaveLength(count);
    for (const node of layout.nodes.values()) {
      expect(Number.isFinite(node.cx)).toBe(true);
      expect(Number.isFinite(node.cy)).toBe(true);
      expect(Number.isFinite(node.r)).toBe(true);
    }
  });
});
