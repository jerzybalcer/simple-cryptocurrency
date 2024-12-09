async function mineManyBlocks(blocksToMine: number) {

    console.log('Scheduled mining of', blocksToMine, 'blocks');

    for(let i = 0; i < blocksToMine; i++) {
        console.log('Mining next block...');

        const blockData = {
            data: 'New block ' + i
        };

        const miningResult = await fetch('http://localhost:3333/mineBlock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blockData),
        })

        console.log(await miningResult.json());
    }
}

mineManyBlocks(100);

