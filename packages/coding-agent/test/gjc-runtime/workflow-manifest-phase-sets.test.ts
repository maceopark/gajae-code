import { describe, expect, it } from "bun:test";
import { getSkillManifest } from "../../src/gjc-runtime/workflow-manifest";

describe("workflow manifest phase sets", () => {
	it("preserves the resolved phase memberships for every workflow skill", () => {
		for (const skill of ["deep-interview", "ralplan", "ultragoal", "team"] as const) {
			expect(getSkillManifest(skill).stopReleasingPhases).toEqual([
				"complete",
				"completed",
				"failed",
				"cancelled",
				"canceled",
				"inactive",
			]);
		}
		expect(getSkillManifest("ralplan").phaseLock).toEqual([
			"final",
			"handoff",
			"complete",
			"completed",
			"failed",
			"cancelled",
			"canceled",
			"inactive",
		]);
		expect(getSkillManifest("ralplan").canonicalOverrides).toEqual(getSkillManifest("ralplan").phaseLock);
	});

	it("routes new ralplan runs through intent while retaining the legacy in-flight review edge", () => {
		const manifest = getSkillManifest("ralplan");
		expect(manifest.states.map(state => state.id)).toContain("intent");
		expect(manifest.transitions).toContainEqual({ from: "planner", to: "intent", verb: "write-artifact" });
		expect(manifest.transitions).toContainEqual({ from: "intent", to: "architect", verb: "write-artifact" });
		expect(manifest.transitions).toContainEqual({ from: "planner", to: "architect", verb: "write-artifact" });
	});
});
