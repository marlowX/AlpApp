import { Router } from 'express';

// Import pod-routerów
import listRoutes from './list.routes';
import detailsRoutes from './details.routes';
import createRoutes from './create.routes';
import pozycjeRoutes from './pozycje.routes';
import statusRoutes from './status.routes';
import completeRoutes from './complete.routes';
import functionsRoutes from './functions.routes';
import kooperanciRoutes from './kooperanci.routes';
import statsRoutes from './stats.routes';

/**
 * Główny router ZKO - agreguje wszystkie pod-moduły
 * 
 * ZASADA: Każdy plik maksymalnie 300 linii!
 * Logika biznesowa w PostgreSQL, routing w Node.js
 */
const router = Router();

// WAŻNE: Kolejność routerów ma znaczenie!
// Bardziej specyficzne ścieżki muszą być przed ogólnymi

// Kooperanci - musi być PRZED /:id bo inaczej 'kooperanci' zostanie potraktowane jako ID
router.use('/', kooperanciRoutes);  // GET /api/zko/kooperanci

// Stats - nowe endpointy do statystyk
router.use('/', statsRoutes);       // GET /api/zko/summary, /api/zko/list-with-stats, /api/zko/:id/stats

// Pozycje - też przed /:id
router.use('/', pozycjeRoutes);     // Operacje na pozycjach

// Create, status, complete, functions - specyficzne ścieżki
router.use('/', createRoutes);      // POST /api/zko/create, DELETE /api/zko/delete/:id
router.use('/', statusRoutes);      // POST /api/zko/status/change, PUT /api/zko/:id/edit
router.use('/', completeRoutes);    // POST /api/zko/:id/complete
router.use('/', functionsRoutes);   // POST /api/zko/functions

// Lista ZKO - GET /api/zko (bez parametrów)
router.use('/', listRoutes);        // GET /api/zko

// Details NA KOŃCU - bo przechwytuje wszystko z /:id
router.use('/', detailsRoutes);     // GET /api/zko/:id, /api/zko/:id/status

export default router;