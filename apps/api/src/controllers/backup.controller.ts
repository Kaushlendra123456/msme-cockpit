import { Request, Response } from "express";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

/**
 * Triggers a full PostgreSQL backup using `pg_dump` and streams the result
 * back as a downloadable file.
 *
 * Requires the `pg_dump` binary to be available in the backend's runtime
 * environment (it ships with the `postgresql-client` package - already
 * included in the production Dockerfile for this service). If it's missing
 * locally, this endpoint returns a clear error explaining how to install it,
 * rather than silently failing.
 */
export const triggerBackup = async (req: Request, res: Response) => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ message: "DATABASE_URL is not configured" });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(os.tmpdir(), `msme-backup-${timestamp}.dump`);

  execFile(
    "pg_dump",
    ["--format=custom", `--file=${outputPath}`, databaseUrl],
    (error) => {
      if (error) {
        return res.status(500).json({
          message:
            "Backup failed. Make sure `pg_dump` is installed and on PATH (it is included in the production Docker image). " +
            `Underlying error: ${error.message}`,
        });
      }

      res.download(outputPath, `msme-backup-${timestamp}.dump`, (downloadErr) => {
        // Clean up the temp file regardless of whether the download succeeded
        fs.unlink(outputPath, () => {});
        if (downloadErr && !res.headersSent) {
          res.status(500).json({ message: "Backup file created but download failed" });
        }
      });
    }
  );
};
