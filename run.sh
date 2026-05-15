#!/bin/bash
echo "Setup ur Server..."
sleep 2
echo "Almost Done!"
sleep 1
docker run --name cstrike \
  -p 27015:27015/udp \
  -p 27015:27015 \
  -v $(pwd)/files/server.cfg:/home/steam/cstrike/cstrike/server.cfg \
  cajuclc/cstrike-docker