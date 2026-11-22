# Modelo de Visibilidad: Niebla de Guerra Estratificada

Decidimos que la visibilidad de los nodos y relaciones en el grafo no será binaria ni plana, sino gobernada por un modelo de tres capas de conocimiento:

1. **Capa Base (Pública)**: Cimientos generales del mundo (ciudades principales, geografía pública, facciones renombradas, mitología común) visibles para todos desde el inicio para dar marco de referencia.
2. **Capa Asimétrica (Trasfondo y Secretos Individuales)**: Nodos condicionales preexistentes que solo se renderizan para el jugador cuyo personaje cumple requisitos específicos (clase, raza, orden o trasfondo personal), incentivando el intercambio de información entre jugadores en la mesa.
3. **Capa Progresiva (Descubrimientos de Campaña)**: Nodos descubiertos en juego (ruinas, pistas, PNJs conocidos, artefactos) que el motor de estados (FSM) desbloquea y "enciende" para todo el grupo (Party) simultáneamente.
