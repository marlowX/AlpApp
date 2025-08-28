import React from 'react';
import { AddPozycjaModal } from './AddPozycja/AddPozycjaModal';

// Re-export głównego komponentu dla backward compatibility
export { AddPozycjaModal };

// Export też dla przypadków gdy ktoś używa starej ścieżki
export { AddPozycjaModal as default };
