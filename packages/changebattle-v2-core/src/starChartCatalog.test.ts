import assert from "node:assert/strict";
import {STAR_CHART_NODES_V4} from "./starChartCatalog.js";

const totalCost = STAR_CHART_NODES_V4
  .flatMap(node => node.costs ?? (node.cost === undefined ? [] : [node.cost]))
  .reduce((sum, cost) => sum + Math.max(0, Math.floor(Number(cost || 0))), 0);

const root = STAR_CHART_NODES_V4.find(node => node.id === "root_trainer_star");

assert.equal(root?.costs?.[0], 0);
assert.ok(totalCost <= 150, `star chart total cost should stay <= 150 BP, got ${totalCost}`);

console.info("starChartCatalog tests passed");
