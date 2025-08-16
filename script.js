// Function to say hello
var currentLuck = 1;
const luckDisplay = document.getElementById("luckDisplay");
const luckInput = document.getElementById("luckInput");
const rollSpeedDisplay = document.getElementById("rollSpeedDisplay");
const rollSpeedInput = document.getElementById("rollSpeedInput");

const container = document.getElementById("potionsContainer");

function changeLuck() {
  let currentLuck = Number(luckInput.value);
  if (!Number.isFinite(currentLuck)) {
    currentLuck = 1;
  }
  luckDisplay.innerHTML = currentLuck;
}

function changeRollSpeed() {
  let rollSpeed = Number(rollSpeedInput.value);
  if (!Number.isFinite(rollSpeed)) {
    rollSpeed = 1;
  }
  rollSpeedDisplay.innerHTML = rollSpeed;
}

let potionData = null;

// Fetch the JSON once when the page loads
async function loadPotionData() {
    try {
        const response = await fetch('data.json'); // path to your JSON file
        if (!response.ok) throw new Error('Network response was not ok');

        potionData = await response.json(); // store in global variable
        console.log('Potion data loaded:', potionData);

        // Example: use it immediately
        resetTotalCosts(); 
        displayPotionRequirements("Greater Perpetual Tonic", 1);
        displayTotalCosts();
    } catch (error) {
        console.error('Error loading JSON:', error);
    }
}


var totalCosts = {
    tokens: 0,
    geodes: {},
    stats: {}
}

function resetTotalCosts() {
  totalCosts = { tokens: 0, geodes: {}, stats: {} };
}

function addItemToTotalCosts(type, name, amount, rarity = 1){
  if(type == 'tokens'){
    totalCosts[type] += amount;
    return; // Early return for tokens
  }
    if (!totalCosts[type]) {
        totalCosts[type] = {};
    }
    
    if (!totalCosts[type][name]) {
        totalCosts[type][name] = { amount: 0, rarity: rarity };
    }
    
    totalCosts[type][name].amount += amount;
}

const displayed = new Set();

function displayPotionRequirements(potionName, amount, isSubPotion = false) {
  if (displayed.has(potionName) && isSubPotion) return; // skip duplicates in recursion
    displayed.add(potionName);
    if (!potionData) {
        console.error('Potion data not loaded yet');
        return;
    }

    // Find the potion by name
    const potion = potionData.potions.find(p => p.name === potionName);
    if (!potion) {
        console.error(`Potion "${potionName}" not found`);
        return;
    }

    // Box container
    const box = document.createElement('div');
    box.classList.add('potion-box'); // add styling class

    box.innerHTML = `<h3>x${amount} ${potion.name}</h3>`;

    const ul = document.createElement('ul');

    // helper: add unique <li>
    function addUniqueItem(type,name, amount,rarity = 0) {
      var text = "";
      switch(type){
        case 'potions':
            text = `x${abbreviateNumber(amount)} ${name}`;
            break;
        case 'geodes':
            text = `x${abbreviateNumber(amount)} ${name} (1/${abbreviateNumber(rarity)})`;
            break;
        case 'stats':
            text = `x${abbreviateNumber(amount)} ${name}`;
            break;
        default:
            text = `${name}`;
      }
        if (text === "") return; // skip empty items
        if (!ul) {
            console.error('UL element not found');
            return;
      }
      if(name == "nothing") {
        text = `x${amount} Tokens or x${Math.round(amount * 0.6)} Tokens (Discounted)`;
      }
      const exists = Array.from(ul.children).some(li => li.textContent === text);
      if (!exists) {
          const li = document.createElement('li');
          li.textContent = text;
          ul.appendChild(li);
      }else{
       
      }
    }

    // Potions required
    potion.potions.forEach(p => {
        if (p.amount > 0) {
            if (p.name === "nothing") {
                const text = `x${potion.cost * amount} Tokens or x${Math.round(potion.cost * amount * 0.6)} Tokens (Discounted)`;
                addUniqueItem('tokens', p.name, potion.cost * amount);
                addItemToTotalCosts('tokens', p.name, potion.cost * amount, p.rarity);
            } else {
                const text = `x${p.amount * amount} ${p.name}`;
                addUniqueItem('potions', p.name, p.amount * amount, p.rarity);
                displayPotionRequirements(p.name, p.amount * amount, true); // recursive
            }
        }
    });

    // Geodes required
    potion.geode.forEach(g => {
        if (g.amount > 0) {
            const text = `x${abbreviateNumber(g.amount * amount)} ${g.name} (1/${abbreviateNumber(g.rarity)})`;
            addUniqueItem('geodes', g.name, g.amount * amount, g.rarity);
            addItemToTotalCosts('geodes', g.name, g.amount * amount, g.rarity);
        }
    });

    // Stats required
    potion.stat.forEach(s => {
        if (s.amount > 0) {
            const text = `x${abbreviateNumber(s.amount * amount)} ${s.name}`;
            addUniqueItem('stats', s.name, s.amount * amount, s.rarity);
            addItemToTotalCosts('stats', s.name, s.amount * amount, s.rarity);
        }
    });

    box.appendChild(ul);

    // Add to main container
    const mainContainer = document.getElementById('potionsContainer');
    mainContainer.insertBefore(box, mainContainer.firstChild);
}


function displayTotalCosts() {
  const totalContainer = document.getElementById("totalCosts");
  totalContainer.innerHTML = ""; // Clear previous content
  const h2 = document.createElement("h2");
  h2.textContent = "Total Costs";
  totalContainer.appendChild(h2);
  const ul = document.createElement("ul");
  for (const type in totalCosts) {
    const typeContainer = document.createElement("div");
    typeContainer.innerHTML = `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3>`;
    const typeUl = document.createElement("ul");
    if(type === 'tokens') {
      const li = document.createElement("li");
      li.textContent = `x${abbreviateNumber(totalCosts[type])} Tokens or x${abbreviateNumber(Math.round(totalCosts[type] * 0.6))} Tokens (Discounted)`;
      typeUl.appendChild(li);
      typeContainer.appendChild(typeUl);
      ul.appendChild(typeContainer);
      continue; // Skip further processing for tokens
    }
    for (const item in totalCosts[type]) {
      const li = document.createElement("li");
      const cost = totalCosts[type][item];
      if(cost.rarity === 1){
        li.textContent = `x${abbreviateNumber(cost.amount)} ${item}`;
      } else {
        li.textContent = `x${abbreviateNumber(cost.amount)} ${item} (1/${cost.rarity})`;
      }
      typeUl.appendChild(li);
    }
    typeContainer.appendChild(typeUl);
    ul.appendChild(typeContainer);
  }
  totalContainer.appendChild(ul);
}



function abbreviateNumber(num) {
    if (num < 1e6) return num.toString(); // show raw numbers below 1 million

    const suffixes = [
        "M",   // million
        "B",   // billion
        "T",   // trillion
        "Qa",  // quadrillion
        "Qn",  // quintillion
        "Sx",  // sextillion
        "Sp",  // septillion
        "Oc",  // octillion
        "No",  // nonillion
        "De",  // decillion
        "UDe",  // undecillion
        "DDe",  // duodecillion
        "TDe",  // tredecillion
        "QaDe", // quattuordecillion
        "QiDe", // quindecillion
        "SxDe", // sexdecillion
        "SpDe", // septendecillion
        "OcDe", // octodecillion
        "NDe",  // novemdecillion
        "Vg"   // vigintillion
    ];

    let tier = Math.floor(Math.log10(num) / 3) - 2; 
    // subtract 2 so tier 0 = million (1e6)

    if (tier >= suffixes.length) tier = suffixes.length - 1;

    let scale = Math.pow(1000, tier + 2); // +2 because first tier is 1e6
    let scaled = num / scale;

    return scaled.toFixed(2) + suffixes[tier];
}

function clearDisplay() {
    // Clear potion boxes
    const potionsContainer = document.getElementById('potionsContainer');
    potionsContainer.innerHTML = '';

    // Clear total costs
    const totalContainer = document.getElementById('totalCosts');
    totalContainer.innerHTML = '';

    // Reset totals
    totalCosts = { tokens: 0, geodes: {}, stats: {} };

    // Optional: reset any other tracking objects if you have them
    if (typeof displayed !== 'undefined') displayed.clear(); // for Option 2 duplicate-prevention
}


function confirmPotion() {
    const potionName = document.getElementById("potionNameInput").value;
    const amount = Number(document.getElementById("potionAmountInput").value);
    if (!potionName || !amount || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid potion name and amount.");
        return;
    }
    clearDisplay();
    resetTotalCosts();
    displayPotionRequirements(potionName, amount);
    displayTotalCosts();
}

document.addEventListener('DOMContentLoaded', loadPotionData);
// Attach event listeners to buttons
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("confirmLuck").addEventListener("click", changeLuck);
  document
    .getElementById("confirmRollSpeed")
    .addEventListener("click", changeRollSpeed);
  document
    .getElementById("confirmPotion")
    .addEventListener("click", confirmPotion);
});
