#!/bin/bash

#Simple setup with one network node

# List of ports to check and kill
PORTS=("3000" "3001" "3002")

for PORT in "${PORTS[@]}"; do
    echo "Checking port $PORT..."
    PID=$(lsof -t -i:$PORT)  # Get the PID of the process
    if [ -n "$PID" ]; then
        echo "Killing process $PID on port $PORT..."
        kill -9 $PID
    else
        echo "No process found on port $PORT."
    fi
done

blockPath="./blocks.json"
keyPairPath="./keys.json"

if [ -f "$blockPath" ]; then  
    rm "$blockPath"
fi

if [ -f "$keyPairPath" ]; then  
    rm "$keyPairPath"
fi

echo "Starting Network Node 1..."
node networkNode.js 3000 &

sleep 3
if [ -f "$blockPath" ]; then  
    rm "$blockPath"
    echo "delete blockchain"
fi

echo "Starting Node 1 with wallet, at 3333"
node Main.js 3002 3000 3333  &

sleep 2
if [ -f "$keyPairPath" ]; then  
    rm "$keyPairPath"
fi

echo "Starting Node 2 with wallet at 3334"
node Main2.js 3003 3000 3334 'password1'  &
sleep 1
enable_mining=$(curl -s http://localhost:3334/enableMining)
sleep 1

node_address=$(curl -s http://localhost:3334/address)

sleep 1
# Remove the last character from the address
echo "address"
echo "$node_address"
sleep 1
# Execute the second curl command, injecting the trimmed address
curl -X POST http://localhost:3333/makeTransaction \
-H "Content-Type: application/json" \
-d "{
  \"receiverAddress\": \"$node_address\",
  \"amount\": 10,
  \"password\": \"default_password\"
}"

echo "All nodes started!"
wait