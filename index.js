

const fs = require('fs')
const axios = require('axios')
const winston = require('winston')
const Bottleneck = require('bottleneck')
const Downloader = require("nodejs-file-downloader");

const TOKEN = ''
const EMAIL = ''
const BASE_URL = 'https://api.zoom.us/v2'
const TYPE = 'cloud'
let FROM = '2022-07-01'
let TO = '2022-08-01'
//Current date
const TODAY = '2023-04-05'
const PAGE_SIZE = 200
let getRecordings = true



const logger = winston.createLogger({

	format: winston.format.json(),
	defaultMeta: { service: 'add-users' },
	transports: [
	  //
	  // - Write all logs with importance level of `error` or less to `error.log`
	  // - Write all logs with importance level of `info` or less to `combined.log`
	  //
	  new winston.transports.File({ filename: './logs/get_recordings.log', level: 'info' }),
	],
  });

const limiter = new Bottleneck({
	maxConcurrent: 2,
	minTime: 500
});


function incrementDateByOneMonth(dateStr) {
	const [year, month, day] = dateStr.split("-");
	let incrementedMonth = Number(month) + 1;
	let incrementedYear = Number(year);
  
	if (incrementedMonth > 12) {
	  incrementedMonth = 1;
	  incrementedYear++;
	}
  
	const newDate = new Date(incrementedYear, incrementedMonth - 1, Number(day));
	return newDate.toISOString().slice(0, 10);
}

function isSecondDateInTheFuture(dateStr1, dateStr2) {
	const [year1, month1, day1] = dateStr1.split("-");
	const [year2, month2, day2] = dateStr2.split("-");
  
	const date1 = new Date(year1, month1 - 1, day1);
	const date2 = new Date(year2, month2 - 1, day2);
  
	return date2.getTime() > date1.getTime();
  }

async function getAllRecordings() {
	while(getRecordings){

		if(isSecondDateInTheFuture(TODAY, TO)){
			getRecordings = false
		} else {

			const url = `${BASE_URL}/users/${EMAIL}/recordings/?type=${TYPE}&from=${FROM}&to=${TO}&page_size=${PAGE_SIZE}`

			const options = {
				method: 'GET',
				headers: {
				  'Authorization': `Bearer ${TOKEN}`
				}
			  }
			const recordings = await axios.get(url, options)

			const {from, to, page_count, page_size, total_records} = recordings.data

			logger.info({url, from, to, page_count, page_size, total_records})

			fs.writeFileSync(`./recordings/${FROM}.json`, JSON.stringify(recordings.data, null, 2), 'utf-8', err => console.log(err))

			FROM = incrementDateByOneMonth(FROM)
			TO = incrementDateByOneMonth(TO)

		}
	
	}

	console.log('DONE!')
}

async function readRecordingFiles(callback, method) {
	const directoryPath = './recordings';

	const store = {}

	fs.readdir(directoryPath, async (err, files) => {
	if (err) {
		console.log(err);
	} else {
		console.log(`Files inside ${directoryPath}:`);

		for(let i = 0; i< files.length; i++) {
			const file = files[i]
			console.log('- ' + file);
			const filePath = `${directoryPath}/${file}`;
			console.log(filePath)
			const data = fs.readFileSync(filePath, 'utf-8')

			if(method == 'download'){
				callback(data)
			} else {
				const {from_folder, parsed} = callback(data);
				store[from_folder] = parsed
			}
			
		}

		if(method !== 'download'){
			fs.writeFileSync('recording_record.json', JSON.stringify(store,null, 2), 'utf-8', err => console.log(err))
		}
	}
	});

}
async function processFile(file){
	//iterate over meetings
	const json_data = JSON.parse(file)

	const from_folder = json_data.from

	for(let i = 0; i < json_data.meetings.length; i++) {
		const meeting = json_data.meetings[i]
		const video = meeting.recording_files.find(f => f.recording_type == "shared_screen_with_speaker_view")
		const title = meeting.topic.split('for ')[1] +'.mp4'
		if(!video){
			console.log('NO VIDEO')
		}else {
			const download_url = video.download_url

			//console.log({video, title, download_url})
			const downloader = new Downloader({
				url: download_url,
				directory: `./downloads/${from_folder}`,
				fileName: title,
				headers: {
					'Authorization': `Bearer ${TOKEN}`
				},
				onProgress: function(percentage, chunk, remainingSize){
					//console.log("% ", percentage, title);
				}
			})

			try{
				await limiter.schedule(() => downloader.download())
				console.log({from_folder, title})
				logger.info(title)

			} catch (e){
				console.log(error)
			}  
		}
	}
}

function createFileRecord(file){
	const json_data = JSON.parse(file)

	const from_folder = json_data.from	

	const parsed = json_data.meetings.map(m => m.topic.split('for ')[1])
	return {from_folder, parsed}
}

  
async function main() {
	/*

		Uncomment each line and run command `node index.js` separately.
		Leave only one line uncommented at a time.
	*/

	//getAllRecordings()

	//readRecordingFiles(processFile, 'download')

}

main()