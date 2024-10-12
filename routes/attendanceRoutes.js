const express = require('express');
const {
    checkIn,
    checkOut,
    requestLeave,
    approveLeave,
    getAttendanceByEmployee,
    getAllAttendance,
    getAttendanceByShiftId,
    getCurrentShiftAttendance,
    getAttendanceInMonth
} = require('../controllers/attendanceController');

const router = express.Router();

// Check In
router.post('/checkin', async (req, res) => {
    await checkIn(req, res);
});

// Check Out
router.post('/checkout', async (req, res) => {
    await checkOut(req, res);
});

// Request Leave
router.post('/leave', async (req, res) => {
    await requestLeave(req, res);
});

// Approve Leave
router.put('/approve-leave/:attendanceId', async (req, res) => {
    await approveLeave(req, res);
});

// Get Attendance by Employee ID
router.get('/employee/:employeeId', async (req, res) => {
    await getAttendanceByEmployee(req, res);
});

// Get All Attendance
router.get('/', async (req, res) => {
    await getAllAttendance(req, res);
});

// Get Attendance by Shift ID
router.get('/shift/:shiftId', async (req, res) => {
    await getAttendanceByShiftId(req, res);
});

// Get Current Shift Attendance
router.get('/current-shift', async (req, res) => {
    await getCurrentShiftAttendance(req, res);
});

// Get Current Shift Attendance
router.get('/monthly/:year/:month', async (req, res) => {
    await getAttendanceInMonth(req, res);
});

module.exports = router;

