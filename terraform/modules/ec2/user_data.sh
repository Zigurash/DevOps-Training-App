#!/bin/bash
set -euo pipefail

hostnamectl set-hostname control-node

apt update -y
