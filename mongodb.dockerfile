# MongoDB image for the compose stack of social-network-api.
#
# The service builds from this file instead of pointing at a registry image
# (R91). The base image is pinned by digest.
FROM mongo:9@sha256:1444adda2e4b8d6a0d7f242a625d834a78d6e3aa6e4ed1b0b4c2dab2318c5e3d

# The database files live in /data/db, which the compose stack mounts from
# var/mongo. The permissions of that directory are set on the host side.
WORKDIR /data/db
