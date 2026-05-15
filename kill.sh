#!/bin/bash
echo "Delete ur container..."
docker kill cstrike
docker rm cstrike

sleep 1
echo "Done!"