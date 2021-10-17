# 👥 Contribution Guide

Start by installing the following:

  - Docker
  - Nodejs

## 🚀 Launching full stack:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```
Then open [localhost](http://localhost) once the stack is up

If you want to test debug with nodejs make sure to copy the local.env file to .env
```bash
cp local.env .env
```

## 📝 Commit Guidelines and Github Flow [WIP]

  - [ ] semantic versioning
  - [ ] conventional commits
  - [ ] image builds