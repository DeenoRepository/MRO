# File Storage & Document Strategy

This document defines the physical file storage layout, naming conventions, hashing/checksum validations, allowed MIME types, and versioning rules for the MRO/CMMS platform.

---

## 1. Local Storage Layout & Path Structure

Files uploaded by users (e.g. technical passports in EPS, attachments in SRS) must be stored in a centralized local folder outside of the Java build directories.

```text
/var/mro/storage/
├── eps/
│   └── documents/
│       └── [equipment_uuid]/
│           └── [document_uuid]_[filename]
└── srs/
    └── attachments/
        └── [ticket_uuid]/
            └── [attachment_uuid]_[filename]
```

### Path Constraints
* **Root Location**: Specified via application properties (`mro.storage.root-dir=/var/mro/storage`).
* **Isolation**: Files are organized within folders matching the originating module (`eps`, `srs`) and parent entity ID (`equipment_uuid`, `ticket_uuid`) to prevent naming collisions.

---

## 2. Integrity Verification & Checksum Policy

To guarantee that uploaded files are not corrupted during upload or modified maliciously on the server:

* **Hash Algorithm**: **SHA-256** checksum must be calculated on the binary input stream during file ingest.
* **Database Ledger**: The resulting 64-character hex checksum must be saved in the database record:
  - `EquipmentDocumentEntity.checksumSha256`
  - `TicketAttachmentEntity` metadata (if checksum verification is enabled).
* **Validation**: Upon download, the storage service re-calculates the checksum and verifies it against the database to guarantee integrity.

---

## 3. Allowed MIME Types & File Categories

To maintain server security and prevent malicious script execution (e.g. shell scripts or executables):

| Category | Description | Allowed MIME Types | File Extensions |
|---|---|---|---|
| **Documents** | Manuals, technical passports, acts | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.pdf`, `.doc`, `.docx` |
| **Spreadsheets**| Parts lists, stock reports | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv` | `.xls`, `.xlsx`, `.csv` |
| **Images** | Damage photos, technician signs | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` |
| **Archives** | Consolidated equipment blueprints| `application/zip`, `application/x-tar` | `.zip`, `.tar` |

---

## 4. Size Limits & Upload Constraints

- **Technical Equipment Documents**: Max **10 MB** per file.
- **Service Request Attachments**: Max **5 MB** per file.
- **Validation**: Enforced at both the server-side gate (Spring `MultipartResolver` configurations) and Angular frontend form validation to ensure friendly user warning.

---

## 5. File Versioning & Archival Rules

* **Version Field**: Each file record in the EPS document schema contains an integer `version` field (starts at `1`).
* **Overwrite Behavior**: Uploading a document with an identical filename under the same equipment UUID does not overwrite the physical file. Instead:
  1. A new document record is created with `version = previous_version + 1`.
  2. The physical file is saved using a unique UUID prefix:
     `[new_uuid]_[filename]`
* **Retention**: Standard ticket attachments are stored permanently as long as the ticket exists. Technical passports are retained as historical records even if equipment status is set to `SCRAPPED`.
