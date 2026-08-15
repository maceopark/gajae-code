import { describe, expect, it } from "bun:test";
import { getSkillManifest } from "../../src/gjc-runtime/workflow-manifest";

describe("workflow manifest phase sets", () => {
	it("preserves the resolved phase memberships for every workflow skill", () => {
		for (const skill of ["deep-interview", "ralplan", "ultragoal", "autoresearch"] as const) {
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

	it("exposes the autoresearch lifecycle with its native command verbs", () => {
		const manifest = getSkillManifest("autoresearch");
		expect(manifest.states.map(state => state.id)).toEqual([
			"intake",
			"research",
			"verdict",
			"complete",
			"failed",
			"cancelled",
			"handoff",
		]);
		expect(manifest.initialState).toBe("intake");
		expect(manifest.terminalStates).toEqual(["complete", "failed", "cancelled", "handoff"]);
		const verbNames = manifest.verbs.map(item => item.name);
		for (const verb of ["spec", "read", "write", "clear", "log-run", "critic", "verdict", "report", "handoff"]) {
			expect(verbNames).toContain(verb);
		}
		expect(manifest.verbs.find(item => item.name === "handoff")?.surface).toBe("state-action");
		expect(manifest.verbs.find(item => item.name === "write")?.surface).toBe("command-positional");
		expect(manifest.transitions).toEqual(
			expect.arrayContaining([
				{ from: "intake", to: "research", verb: "write" },
				{ from: "intake", to: "research", verb: "spec" },
				{ from: "research", to: "verdict", verb: "verdict" },
			]),
		);
	});
});
