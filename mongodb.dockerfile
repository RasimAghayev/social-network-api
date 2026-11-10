# MongoDB image for the compose stack of social-network-api.
#
# The service builds from this file instead of pointing at a registry image
# (R91). The base image is pinned by digest.
FROM mongo:9@sha256:452bdaf2127b8ff851e31410a267809b9829eded219979f2210e7c7efb85a058

# The database files live in /data/db, which the compose stack mounts from
# var/mongo. The permissions of that directory are set on the host side.
WORKDIR /data/db
