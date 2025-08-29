import { Router } from 'express';

// Import pod-routerów
import listRoutes from './list.routes';
import detailsRoutes from './details.routes';
import createRoutes from './create.routes';
import pozycjeRoutes from './pozycje.routes';
import statusRoutes from './status.routes';
import completeRoutes from './complete.routes';
import functionsRoutes from './functions.routes';

/**
 * Główny router ZKO - agreguje wszystkie pod-moduły
 * 
 * ZASADA: Każdy plik maksymalnie 300 linii!
 * Logika biznesowa w PostgreSQL, routing w Node.js
 */
const router = Router();

// TYMCZASOWO: Wracamy do starej kolejności
// Problem z routingiem trzeba rozwiązać inaczej
router.use('/', listRoutes);        // GET /api/zko
router.use('/', detailsRoutes);     // GET /api/zko/:id, /api/zko/:id/status

// Pozycje PRZED create żeby /pozycje/:id działało
router.use('/', pozycjeRoutes);     // Operacje na pozycjach

router.use('/', createRoutes);      // POST /api/zko/create, DELETE /api/zko/:id
router.use('/', statusRoutes);      // POST /api/zko/status/change
router.use('/', completeRoutes);    // POST /api/zko/:id/complete
router.use('/', functionsRoutes);   // POST /api/zko/functions

export default router;