import { describe, expect, test } from "bun:test";
import {
	EDIT_PERSIST_FIELD_MAX_CHARS,
	EDIT_SNAPSHOT_EXTERNALIZED_NOTICE,
	type EditSnapshotReceipt,
	editSnapshotPersistableInline,
	editSnapshotReceipt,
} from "@gajae-code/coding-agent/edit";

/**
 * #4593 regression: hub modules that consume edit-snapshot receipts must not
 * drag the renderer/streaming graph (and the hashline import cycle) into
 * module-initialization order. Importing the edit barrel first must leave
 * every marker binding initialized — previously this threw
 * `ReferenceError: Cannot access 'END_PATCH_MARKER' before initialization`.
 */
describe("edit snapshot receipt leaf initialization (#4593)", () => {
	test("edit barrel re-exports the leaf helpers with values initialized", () => {
		expect(EDIT_PERSIST_FIELD_MAX_CHARS).toBe(16 * 1024);
		expect(EDIT_SNAPSHOT_EXTERNALIZED_NOTICE).toContain("edit snapshot externalized");
		expect(editSnapshotPersistableInline("x".repeat(EDIT_PERSIST_FIELD_MAX_CHARS))).toBe(true);
		expect(editSnapshotPersistableInline("x".repeat(EDIT_PERSIST_FIELD_MAX_CHARS + 1))).toBe(false);
		expect(editSnapshotPersistableInline(undefined)).toBe(false);
	});

	test("receipt builds bounded digest identity", () => {
		expect(editSnapshotReceipt(undefined)).toBeUndefined();
		const empty = editSnapshotReceipt("") as EditSnapshotReceipt;
		expect(empty).toEqual({ bytes: 0, sha256: "" });
		const receipt = editSnapshotReceipt("hello") as EditSnapshotReceipt;
		expect(receipt.bytes).toBe(5);
		// SHA-256("hello")
		expect(receipt.sha256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
	});

	test("session-manager leaf import path no longer initializes renderer graph early", async () => {
		// The session-manager now imports ../edit/snapshot-receipt directly; the
		// discriminator is that loading session-manager does not throw a TDZ error
		// even when it is the first edit-adjacent module to load.
		const mod = await import("../src/session/session-manager");
		expect(Object.keys(mod).length).toBeGreaterThan(0);
	});
});
