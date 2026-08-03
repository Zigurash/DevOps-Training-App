# Role: containerd

## Purpose

Installs and configures containerd runtime for Kubernetes.

## Responsibilities

- install containerd
- generate config.toml
- enable SystemdCgroup
- restart containerd
- enable service on boot

## Variables

containerd_version = containerd.io=1.7.*

## Tags

- containerd
- runtime

## Dependencies

common