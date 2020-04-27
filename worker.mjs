import shm from 'shm-typed-array';

let jobs;
process.on('message', async (msg) => {
    let workerData = [];
        id = msg.id;
        
        jobs = shm.get(msg.jobsKey, 'Uint8Array');
        for (let i = 0; i < 20; i++) {
            workerData.push(shm.get(msg.workerDataKeys[i]));
        }
        
            let i = 0;
    while (1) {
            //taking a job - number in array to fill with data
            if (!i) {
                while (!jobs[i]) {
                    i++;
                    if (i > 20) {
                        await sleep(1000);
                        i = 0;
                        continue;
                    }
                }
                jobs[i] = 0;
            }

        const result = createJobResult();
        
        workData[i].write(result);
        
        process.send({workNumber: i, workSize: result.length});
        
        i = 0;
      }
 });
