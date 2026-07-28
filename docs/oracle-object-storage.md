# Oracle Object Storage for Tasaheel media

Production media is stored in the private `tasaheel-media` bucket. The backend
authenticates with the Oracle Compute instance principal; no user API key or
service-account private key is required.

## Production environment

```env
MEDIA_STORAGE_PROVIDER=oci
OCI_OBJECT_STORAGE_REGION=me-riyadh-1
OCI_OBJECT_STORAGE_NAMESPACE=axwurkwudzgw
OCI_OBJECT_STORAGE_BUCKET=tasaheel-media
MEDIA_STORAGE_MIGRATE_LOCAL=false
```

Local development and tests continue to use:

```env
MEDIA_STORAGE_PROVIDER=local
```

## Legacy migration

The `/tmp/tasaheel/uploads` Docker volume remains mounted during the migration.
For one production deployment only, set:

```env
MEDIA_STORAGE_MIGRATE_LOCAL=true
```

The startup runner copies every existing local file to Object Storage while
preserving its relative key. It does **not** delete the local copy. Confirm the
objects and old URLs before setting the flag back to `false`.

When OCI storage is enabled, reads that return `404` from Object Storage fall
back to the legacy local volume. This keeps old links working during migration.

## Application behavior

- New files are uploaded directly to Object Storage.
- Database rows retain metadata and a stable `/uploads/{objectKey}` URL.
- The API streams private objects to clients and supports byte ranges for audio
  and video.
- Deletes remove the object from OCI and any legacy local copy.
- Chat media is grouped under `chat/{roomId}/`.
- Request media is grouped under `requests/{requestId}/`.
