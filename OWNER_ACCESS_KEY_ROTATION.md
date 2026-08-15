# KEIRA Owner Access Key Rotation

The private owner access key is a **runtime secret** named `PORTAL_OWNER_ACCESS_TOKEN`. It is never stored in the repository, database, client bundle, or application logs.

To rotate the key, provide the new value through the protected secret input, then update the same variable in `/opt/keira/.env` on the São Paulo instance and restart the `keira` systemd service. A successful owner entry establishes a new signed session; an invalid key returns a generic authorization failure without revealing whether any particular candidate was close to the configured value.

```bash
cd /opt/keira
read -rsp 'New private owner access key (input hidden): ' OWNER_KEY && echo
sed -i "s|^PORTAL_OWNER_ACCESS_TOKEN=.*|PORTAL_OWNER_ACCESS_TOKEN=${OWNER_KEY}|" .env
unset OWNER_KEY
chmod 600 .env
sudo systemctl restart keira
```

After rotation, open `https://keira.xinus.one`, enter the new key at **Open Portal as Tyler Morris**, and confirm access. Do not place the key in chat, git commits, screenshots, or shell history.
