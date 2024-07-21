# SRT Shift JS
This project is a frontend only app that manipulate SRT file with new defined timestamp.
- Only human readable timestamp are manipulatable. (You should not need to manipulate millisecond timestamp. Millisecond timestamps are for calculating time duration.)
- After manipulating a human readable timestamp, all other timestamps are calculated based on \[duration\] and \[until next timestamp\] both calculated in ms.

# How it works:
1. Open up **index.html** file, it will automatically load the following dependencies:
    1. [Bootstrap 5](https://getbootstrap.com/)
    2. [jQuery 3.7.1](https://jquery.com/)
    3. main.js (where SRTShift logic happens)
2. Load an SRT file into the app. The table should populate with timestamp and subtitle text. 
    1. This process will calculate constants like duration and until next timestamp.
3. Manipulate a human readable timestamp column
4. There is a 5 second timeout before recalculating all other fields (just in case you type slow)
5. Save the newly calculated SRT file

# Calculations

| Terminology          | Description                                                                 | Calculation                                      |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| Duration             | This is the duration of displaying a subtitle                               | Current timestamp end - Current timestamp start  |
| Until Next Timestamp | This is the duration of current subtitle disappear and next subtitle appear | (Next) timestamp start - (Current) timestamp end |

