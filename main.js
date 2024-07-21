let timestamps = "";
let filename = "";

const loadFileAsText = () => {
	const srtFile = document.getElementById("uploadFile").files[0];
	filename = srtFile.name;
	const fileReader = new FileReader();
	fileReader.onload = function (fileLoadedEvent) {
		const stringInput = fileLoadedEvent.target.result;
		timestamps = parseToObj(stringInput);
		getRelativeTime(timestamps);
		generateTable(timestamps);
	};

	fileReader.readAsText(srtFile, "UTF-8");
	$("#saveSRT").prop("disabled", false);
};

const saveTextAsFile = () => {
	let output = "";
	timestamps.forEach((item) => {
		output += item.sequence + "\n";
		output += item.timeStart + " --> " + item.timeEnd + "\n";
		output += item.text.replaceAll("\\n", "\n") + "\n";
		output += "\n";
	});

	var downloadLink = document.createElement("a");
	var blob = new Blob(["\ufeff", output]);
	var url = URL.createObjectURL(blob);

	downloadLink.href = url;
	downloadLink.download = filename + ".srt";

	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
	$("#alert").text(
		"SRT Saved " +
			new Date()
				.toLocaleString("en-CA", {
					timeZone: "America/Los_Angeles",
					hour12: false,
				})
				.replace(",", ""),
	);
};

const generateTable = (timestamps) => {
	timestamps.forEach((item) => {
		$("#subtitleTable>tbody").append(
			`<tr>
                <td>${item.sequence}</td>
                <td>${item.timeStartMs}</td>
                <td>${item.timeEndMs}</td>
                <td contenteditable='true' class="timeChange" data-startOrEnd="start">${item.timeStart}</td>
                <td contenteditable='true' class="timeChange" data-startOrEnd="end">${item.timeEnd}</td>
                <td>${item.timeDuration}</td>
                <td>${item.timeRelativeToNext}</td>
                <td>${item.text.replaceAll("\n", "\\n")}</td>
            </tr>`,
		);
	});
};

const parseToObj = (inputString) => {
	const result = [];
	const arr = inputString.split("\n");

	// Remove last few empty lines
	for (let i = arr.length - 1; i > 0; i--) {
		if (arr[i] != "") {
			arr.splice(i + 1, arr.length - i + 2);
			break;
		}
	}

	// Determine which lines are new lines, taken multiline subtitle into account
	const newLines = arr
		.map((line, i) => (line === "" ? i : -1))
		.filter((index) => index !== -1);

	for (let i = 0; i < newLines.length; i++) {
		const startIdx = i != 0 ? newLines[i - 1] + 1 : 0;
		const endIdx = newLines[i];
		const timestamp = arr[startIdx + 1].split(" --> ");
		const timeStartMs = parseTimeToMs(timestamp[0]);
		const timeEndMs = parseTimeToMs(timestamp[1]);

		result.push({
			sequence: parseInt(arr[startIdx]),
			timeStartMs,
			timeEndMs,
			timeStart: timestamp[0],
			timeEnd: timestamp[1],
			timeDuration: timeEndMs - timeStartMs,
			text: arr.slice(startIdx + 2, endIdx).join("\n"),
		});
	}

	return result;
};

const parseTimeToMs = (time) => {
	let ms = parseInt(time.split(",")[1]);
	const parsedTimestamp = time
		.substring(0, time.indexOf(","))
		.split(":")
		.map((item) => parseInt(item));

	// hr to ms
	ms += parsedTimestamp[0] * 60 * 60 * 1000;
	// min to ms
	ms += parsedTimestamp[1] * 60 * 1000;
	// sec to ms
	ms += parsedTimestamp[2] * 1000;

	return ms;
};

const parseTimeToHHMMSS = (time) => {
	if (time <= 0) {
		return "00:00:00,000";
	}

	let HHMMSS = "";
	// ms to hr
	HHMMSS += String(Math.floor(time / (60 * 60 * 1000))).padStart(2, "0") + ":";
	time = time % (60 * 60 * 1000);

	// ms to min
	HHMMSS += String(Math.floor(time / (60 * 1000))).padStart(2, "0") + ":";
	time = time % (60 * 1000);

	// ms to sec
	HHMMSS += String(Math.floor(time / 1000)).padStart(2, "0") + ",";
	time = time % 1000;

	if (time == 0) {
		HHMMSS += "000";
	} else {
		HHMMSS += String(time);
	}

	return HHMMSS;
};

// Until Next Timestamp - this is time duration of current subtitle disappear and next subtitle appear
const getRelativeTime = (timestamps) => {
	for (let i = 0; i < timestamps.length - 1; i++) {
		timestamps[i].timeRelativeToNext =
			timestamps[i + 1].timeStartMs - timestamps[i].timeEndMs;
	}
};

var timeout = null;
$(document).on("input", ".timeChange", function (event) {
	var that = this;
	const tr = $(this).parent();
	const startOrEnd = $(this).data("startorend");

	if (timeout !== null) {
		clearTimeout(timeout);
	}

	timeout = setTimeout(function () {
		const sequenceModified = parseInt($($($(tr).children()).get(0)).text());

		// taken user modified value (determine if start or end is modified and calculate accordingly)
		for (let i = 0; i < timestamps.length; i++) {
			const item = timestamps[i];
			if (item.sequence === sequenceModified) {
				let newTimeStart = "";
				let newTimeEnd = "";

				if (startOrEnd === "start") {
					newTimeStart = $($($(tr).children()).get(3))
						.text()
						.trim();
					newTimeStartMs = parseTimeToMs(newTimeStart);
					newTimeEndMs = newTimeStartMs + item.timeDuration;
					newTimeEnd = parseTimeToHHMMSS(newTimeEndMs);
				} else {
					newTimeEnd = $($($(tr).children()).get(4))
						.text()
						.trim();
					newTimeEndMs = parseTimeToMs(newTimeEnd);
					newTimeStartMs = newTimeEndMs - item.timeDuration;
					newTimeStart = parseTimeToHHMMSS(newTimeStartMs);
				}

				item.timeStart = newTimeStart;
				item.timeEnd = newTimeEnd;
				item.timeStartMs = newTimeStartMs;
				item.timeEndMs = newTimeEndMs;

				break;
			}
		}

		updateSubtitle(sequenceModified);

		$("#alert").text(
			"Timestamps recalculated " +
				new Date()
					.toLocaleString("en-CA", {
						timeZone: "America/Los_Angeles",
						hour12: false,
					})
					.replace(",", ""),
		);
		$("#alert").css("display", "block");
	}, 5000);
});

// Modify all other timestamps based on Duration and Relative to next subtitle constants
const updateSubtitle = (sequence) => {
	for (let i = sequence + 1; i < timestamps.length; i++) {
		const prevTimestamp = timestamps[i - 1];
		const currTimestamp = timestamps[i];
		currTimestamp.timeStartMs =
			prevTimestamp.timeEndMs + prevTimestamp.timeRelativeToNext;
		currTimestamp.timeEndMs =
			currTimestamp.timeStartMs + currTimestamp.timeDuration;
		currTimestamp.timeStart = parseTimeToHHMMSS(currTimestamp.timeStartMs);
		currTimestamp.timeEnd = parseTimeToHHMMSS(currTimestamp.timeEndMs);
	}

	if (sequence > 0) {
		for (let i = sequence; i > 0; i--) {
			console.log(i);
			const prevTimestamp = timestamps[i - 1];
			const currTimestamp = timestamps[i];
			prevTimestamp.timeEndMs =
				currTimestamp.timeStartMs - prevTimestamp.timeRelativeToNext > 0
					? currTimestamp.timeStartMs - prevTimestamp.timeRelativeToNext
					: 0;
			prevTimestamp.timeStartMs =
				prevTimestamp.timeEndMs - prevTimestamp.timeDuration > 0
					? prevTimestamp.timeEndMs - prevTimestamp.timeDuration
					: 0;
			prevTimestamp.timeEnd = parseTimeToHHMMSS(prevTimestamp.timeEndMs);
			prevTimestamp.timeStart = parseTimeToHHMMSS(prevTimestamp.timeStartMs);
		}
	}

	$("#subtitleTable>tbody").empty();

	generateTable(timestamps);
};
