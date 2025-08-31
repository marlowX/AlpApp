// Test skrypt JavaScript dla testowania API palet z przeglądarki
// Uruchom w konsoli deweloperskiej przeglądarki na http://localhost:3001

async function testPaletyAPI() {
  console.log('🧪 Test API endpoint /api/pallets/manual/batch');
  console.log('='.repeat(50));

  const testData = {
    pozycja_id: 68,
    palety: [
      {
        formatki: [
          {
            formatka_id: 288,
            ilosc: 3
          }
        ],
        przeznaczenie: "MAGAZYN",
        max_waga: 700,
        max_wysokosc: 1440,
        operator: "browser_test"
      }
    ]
  };

  console.log('📋 Dane testowe:', JSON.stringify(testData, null, 2));
  console.log('');

  try {
    console.log('📤 Wysyłam POST do /api/pallets/manual/batch...');
    
    const response = await fetch('/api/pallets/manual/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);
    
    const data = await response.json();
    console.log('📥 Response data:', data);

    if (response.ok && data.sukces) {
      console.log('✅ SUCCESS: Palety utworzone pomyślnie!');
      console.log('📦 Utworzono palet:', data.palety_utworzone?.length || 0);
    } else {
      console.log('❌ ERROR:', data.error || 'Nieznany błąd');
      if (data.details) {
        console.log('📝 Szczegóły:', data.details);
      }
    }

  } catch (error) {
    console.error('❌ Network/JavaScript error:', error);
  }

  console.log('='.repeat(50));
}

// Uruchom test
testPaletyAPI();

// Dodatkowa funkcja do sprawdzenia dostępnych formatek
async function sprawdzDostepneFormatki(pozycjaId = 68) {
  console.log(`🔍 Sprawdzanie formatek dla pozycji ${pozycjaId}...`);
  
  try {
    const response = await fetch(`/api/pallets/position/${pozycjaId}/available-formatki`);
    const data = await response.json();
    
    if (data.sukces) {
      console.log('📋 Dostępne formatki:', data.formatki);
      console.log('📊 Podsumowanie:', data.podsumowanie);
    } else {
      console.log('❌ Błąd:', data.error);
    }
  } catch (error) {
    console.error('❌ Błąd sieci:', error);
  }
}

console.log('📖 Dostępne funkcje:');
console.log('  - testPaletyAPI() - test tworzenia palety');
console.log('  - sprawdzDostepneFormatki(pozycjaId) - sprawdź formatki pozycji');
