# Setup
**For basic setup with one node network node and two nodes connected use following:**

**Network node**
```Python
Node networkNode.js 3000
```

**Wallet nodes:**
```Python
Node Main.js 3001 3000 3333 // wallet port, port to connect, http api port
Node Main2.js 3002 3000 3334
```
**Type each command in different terminal. Main.js and Main2.js are used to create two wallets with different passwords - it's a bit faster then doing through curl api and is consistent**

**Remmeber to enable mining in nodes that you want**
```Python
 curl http://localhost:3334/enableMining
```
# Transactions
**By default first wallet node to initialize, gets 40 coins, to allow to make transactions. For making transaction you need address of recevier, amount of coins to send and also the password. Curl command looks as follows (assuming api port is 3333):**

**Rember to put correct recevier address-  you can get it from**
```Python
curl http://localhost:3334/address
```

```Python
curl -X POST http://localhost:3333/makeTransaction \
-H "Content-Type: application/json" \
-d '{
  "receiverAddress": "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEEMZVyhwzJujMhq4DmbTV1kknMluD2WbO8I52RL6gn/a9dJfhcIkrPX/Rjf0Uv1G5BIQnxfwckIYpuFqed0mhCQ==",
  "amount": 10,
  "password": "default_password"
}'
```
# Additional notes
**Remeber to delete blocks.json between each testing to avoid storing information from previous runs**

