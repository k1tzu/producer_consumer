import cluster from 'cluster';
import shm from 'shm-typed-array';
import http from 'http';
const server = http.createServer();
server.listen("80");

let workerData = [];
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async function () {
//this is an array for jobs
    const workerDataKeys = [];
    const jobs = shm.create(30, 'Uint8Array');
    //we fill it with 1 meaning all jobs are available
    Array.prototype.fill.call(jobs, 1);
    //we create an array for 20 pieces of jobs result size 40Mb each
    for(let i=0;i<20;i++){
        workerData.push(shm.create(40000000, 'Buffer'));
    }
    //we need to pass that array to workers so we
    //create a temp array filled with shared memory module keys for buffers
    for(let i=0;i<20;i++){
        workerDataKeys.push(workerData[i].key);
    }
    
    //we point on the file to run worker code from
    cluster.setupMaster({
        exec: 'worker.mjs',
    });

    //we create 3 workers
    for (let i = 0; i < 3; i += 1) {
        cluster.fork();
    }
    
    for (const id in cluster.workers) {
        cluster.workers[id].on( 'message', function (work) {
            if (work && work.workNumber && work.workSize) {
                completedJobs.push(work);
            }
        });

        setTimeout(()=> {
            console.info("Sending message to worker");
            cluster.workers[id].send({id, msg: 'shm', jobsKey: jobs.key, workerDataKeys: workerDataKeys);
        }, 500);
    }
    
    server.on('request', async function (req, res) {
        res.writeHead(200, {'Content-Type': 'application/json', 'Content-Encoding': 'utf-8'});
        let work;
        while(!(work = completedJobs.shift())){
                await sleep(500);
        }
        
        res.end(workerData[work.workNumber].toString('utf8',0,work.workSize),() => {
            //after sending setting that this buffer is available to fill with work result
            jobs[work.workNumber] = 1;
        });
    }    
    
})();

