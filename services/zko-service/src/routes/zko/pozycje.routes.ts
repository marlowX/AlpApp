import { Router } from 'express';
import {
  handleAddPozycja,
  handleDeletePozycja,
  handleEditPozycja
} from './handlers/pozycje.handlers';

const router = Router();

/**
 * Routing dla operacji na pozycjach ZKO
 * Logika biznesowa w PostgreSQL, handlery w osobnym pliku
 */

// POST /api/zko/pozycje/add - Dodawanie pozycji
router.post('/pozycje/add', handleAddPozycja);

// DELETE /api/zko/pozycje/:id - Usuwanie pozycji
// Nie walidujemy body dla DELETE - parametry są opcjonalne
router.delete('/pozycje/:id', handleDeletePozycja);

// PUT /api/zko/pozycje/:id - Edycja pozycji  
router.put('/pozycje/:id', handleEditPozycja);

export default router;