/**
 * Bounded durable edit-snapshot receipts (#4566).
 *
 * Leaf module: imports only node builtins so early-initializing hub modules
 * (`session/session-manager.ts`) can consume these helpers without pulling
 * the edit renderer/streaming module graph (and its hashline import cycle)
 * into their initialization order (#4593 TDZ regression).
 */
import { createHash } from "node:crypto";

/** UTF-8 byte length plus SHA-256 content digest of one edit snapshot. */
export interface EditSnapshotReceipt {
	/** UTF-8 byte length of the snapshot (`0` for create/delete-absent sides). */
	bytes: number;
	/** SHA-256 hex digest of the exact snapshot text (empty string for length 0). */
	sha256: string;
}

/** Per-edit-mode cap on any single persisted edit-result string field (#4566). */
export const EDIT_PERSIST_FIELD_MAX_CHARS = 16 * 1024;

/** Fixed marker used when a snapshot receipt replaces a full body. */
export const EDIT_SNAPSHOT_EXTERNALIZED_NOTICE =
	"[edit snapshot externalized: see oldTextDigest/newTextDigest; full body omitted from transcript]";

function sha256Hex(text: string): string {
	if (text.length === 0) return "";
	return createHash("sha256").update(Buffer.from(text, "utf-8")).digest("hex");
}

/** Build the bounded durable receipt for one snapshot body. */
export function editSnapshotReceipt(text: string | undefined): EditSnapshotReceipt | undefined {
	if (text === undefined) return undefined;
	return { bytes: Buffer.byteLength(text, "utf-8"), sha256: sha256Hex(text) };
}

/** True when a snapshot body is small enough to persist inline without amplification. */
export function editSnapshotPersistableInline(text: string | undefined): boolean {
	return text !== undefined && text.length <= EDIT_PERSIST_FIELD_MAX_CHARS;
}
