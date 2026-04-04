import Papa from 'papaparse';

// ─── Google Sheets CSV fetcher ───
// After publishing your Google Sheet, each sheet has a CSV URL like:
// https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:csv&sheet=SheetName
//
// Set your sheet ID below after publishing:

const SHEET_ID = '1B3x0MJmoTnAqJwTfZ99uT3K-_B1MvMdKxStFqzpARRY';

function sheetURL(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

async function fetchSheet(sheetName) {
  try {
    const res = await fetch(sheetURL(sheetName));
    const text = await res.text();
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
    return data;
  } catch (e) {
    console.warn(`Failed to fetch sheet "${sheetName}":`, e);
    return null;
  }
}

export async function fetchAllData() {
  const [weightRows, fitnessRows, taskRows, debtRows, settingsRows] = await Promise.all([
    fetchSheet('Weight'),
    fetchSheet('Fitness'),
    fetchSheet('Tasks'),
    fetchSheet('Debts'),
    fetchSheet('Settings'),
  ]);

  const result = { weight: null, fitness: null, tasks: null, debts: null, settings: null };

  // Parse Weight sheet (Metric, Value pairs)
  if (weightRows) {
    const get = (label) => {
      const row = weightRows.find(r => r.Metric === label);
      return row ? row.Value : null;
    };
    result.weight = {
      start: Number(get('Starting Weight (lbs)')) || 268,
      current: Number(get('Current Weight (lbs)')) || 243,
      goal: Number(get('Goal Weight (lbs)')) || 210,
      bodyFat: { start: Number(get('Starting Body Fat (%)')) || 35, current: Number(get('Current Body Fat (%)')) || 28, goal: Number(get('Goal Body Fat (%)')) || 15 },
      fatMass: { start: Number(get('Starting Fat Mass (lbs)')) || 97, current: Number(get('Current Fat Mass (lbs)')) || 69, goal: Number(get('Goal Fat Mass (lbs)')) || 30 },
      muscle: { start: Number(get('Starting Muscle (lbs)')) || 140, current: Number(get('Current Muscle (lbs)')) || 155, goal: Number(get('Goal Muscle (lbs)')) || 180 },
      soberDate: get('Sober Date') || '2025-11-05',
    };
  }

  // Parse Fitness sheet
  if (fitnessRows) {
    result.fitness = fitnessRows.map((r, i) => ({
      id: i + 1,
      name: r.Activity || '',
      icon: { 'Press-ups': '💪', 'Cycling': '🚴', 'Running': '🏃', 'Weight Lifting': '🏋️', 'Rowing': '🚣' }[r.Activity] || '🎯',
      start: Number(r.Start) || 0,
      current: Number(r.Current) || 0,
      goal: Number(r.Goal) || 0,
      unit: r.Unit || '',
      doneToday: (r['Done Today'] || '').toLowerCase() === 'yes',
    }));
  }

  // Parse Tasks sheet
  if (taskRows) {
    result.tasks = taskRows.map((r, i) => ({
      id: i + 1,
      category: (r.Category || '').toLowerCase(),
      text: r.Task || '',
      done: (r.Status || '').toLowerCase() === 'done',
    }));
  }

  // Parse Debts sheet
  if (debtRows) {
    result.debts = debtRows.map((r, i) => ({
      id: i + 1,
      name: r['Card Name'] || '',
      icon: (r['Card Name'] || '').includes('Natwest') ? '🏦' : (r['Card Name'] || '').includes('BA') ? '✈️' : '💳',
      used: Number(String(r['Balance Owed (£)'] || '0').replace(/[£,]/g, '')) || 0,
      limit: Number(String(r['Credit Limit (£)'] || '0').replace(/[£,]/g, '')) || 0,
    }));
  }

  // Parse Settings sheet
  if (settingsRows) {
    const get = (label) => {
      const row = settingsRows.find(r => r.Setting === label);
      return row ? row.Value : null;
    };
    result.settings = {
      title: get('Dashboard Title') || "James's Life Dashboard",
      location: get('Location') || 'Kingston upon Thames',
      lat: Number(get('Latitude')) || 51.4123,
      lon: Number(get('Longitude')) || -0.3007,
      soberDate: get('Sober Date') || '2025-11-05',
      currency: get('Currency Symbol') || '£',
    };
  }

  return result;
}

export function isConfigured() {
  return SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE';
}

export { SHEET_ID };
