const XLSX = require('xlsx');

// Create educators Excel file
const educatorsData = [
  ['name'],
  ['Dr. Sarah Johnson'],
  ['Prof. Michael Chen'],
  ['Dr. Emily Rodriguez'],
  ['Mr. David Thompson'],
  ['Dr. Lisa Wang'],
  ['Prof. James Wilson'],
  ['Dr. Maria Garcia'],
  ['Mr. Robert Brown'],
  ['Dr. Jennifer Lee'],
  ['Prof. Christopher Davis']
];

const educatorsWS = XLSX.utils.aoa_to_sheet(educatorsData);
const educatorsWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(educatorsWB, educatorsWS, 'Educators');
XLSX.writeFile(educatorsWB, 'sample-educators.xlsx');

// Create rooms Excel file
const roomsData = [
  ['name', 'capacity'],
  ['Room 101', 30],
  ['Room 102', 25],
  ['Room 103', 35],
  ['Room 201', 40],
  ['Room 202', 30],
  ['Lab 1', 20],
  ['Lab 2', 25],
  ['Auditorium A', 100],
  ['Conference Room', 15],
  ['Computer Lab', 30]
];

const roomsWS = XLSX.utils.aoa_to_sheet(roomsData);
const roomsWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(roomsWB, roomsWS, 'Rooms');
XLSX.writeFile(roomsWB, 'sample-rooms.xlsx');

console.log('Excel sample files created successfully!');
