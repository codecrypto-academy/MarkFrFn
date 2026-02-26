# Ejercicio — Votación con Múltiples Cuentas

Prueba pendiente para validar el flujo de votación con dos votantes distintos en conflicto.

---

## Objetivo

Verificar que:
- Dos cuentas distintas pueden votar en la misma propuesta
- Los votos en conflicto (A FAVOR vs EN CONTRA) se contabilizan correctamente
- El daemon ejecuta o rechaza según el resultado

---

## Preparación (hacer una sola vez)

### Importar la segunda cuenta en MetaMask

Cuenta **Anvil #3**:
```
Clave privada: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Dirección:     0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

MetaMask → Importar cuenta → Pegar la clave privada.

---

## Flujo del ejercicio

### 1. Arrancar el stack
```bash
cd P02-dao
bash start.sh
```

### 2. Conectar con cuenta #2 (votante A)
- MetaMask → seleccionar cuenta `0x3C44...293BC`
- Abrir `http://localhost:3000` → Conectar MetaMask

### 3. Fondear el DAO con cuenta #2
- Tab **"Fondear DAO"** → depositar `2 ETH`
- Confirmar transacción en MetaMask
- Balance del DAO: 2 ETH

### 4. Cambiar a cuenta #3 en MetaMask y fondear también
- MetaMask → cambiar a cuenta `0x90F7...b906`
- Recargar la app → Conectar MetaMask
- Tab **"Fondear DAO"** → depositar `1 ETH`
- Confirmar transacción en MetaMask
- Balance total del DAO: 3 ETH

> Cuenta #2 tiene 2 ETH (66.6% del total → puede crear propuestas)
> Cuenta #3 tiene 1 ETH (33.3% del total → puede votar pero NO crear propuestas)

### 5. Volver a cuenta #2 y crear una propuesta
- MetaMask → cambiar a cuenta `0x3C44...293BC`
- Recargar la app → Conectar MetaMask
- Tab **"Nueva Propuesta"** → rellenar:
  - Destinatario: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` (Anvil #4)
  - Monto: `0.5 ETH`
  - Duración: `3` minutos
  - Descripción: `Prueba votación multi-cuenta`
- Clic en **"Crear Propuesta (Gasless)"** → firmar en MetaMask (sin gas)

### 6. Votar A FAVOR con cuenta #2
- Tab **"Propuestas"** → ver la propuesta activa
- Clic en **"A FAVOR"** → firmar en MetaMask
- Contadores: 1 a favor, 0 en contra

### 7. Cambiar a cuenta #3 y votar EN CONTRA
- MetaMask → cambiar a cuenta `0x90F7...b906`
- Recargar la app → Conectar MetaMask
- Tab **"Propuestas"** → misma propuesta
- Clic en **"EN CONTRA"** → firmar en MetaMask
- Contadores: 1 a favor, 1 en contra

### 8. Esperar el deadline y observar el resultado
- Con empate (1 vs 1) el daemon NO debe ejecutar la propuesta
  - Condición del contrato: `votesFor > votesAgainst` (no mayor o igual)
  - La propuesta debe quedar en estado **Rechazada**

---

## Variante: que gane A FAVOR

Repetir el ejercicio pero en el paso 7 votar también A FAVOR con la cuenta #3.
Resultado esperado: propuesta **Ejecutada** — 0.5 ETH transferidos a Anvil #4.

---

## Variante: cambio de voto

1. Cuenta #3 vota EN CONTRA
2. Esperar un momento
3. Cuenta #3 cambia el voto a A FAVOR (antes del deadline)
4. Resultado final: 2 votos a favor, 0 en contra → propuesta aprobada y ejecutada

---

## Resultados esperados

| Escenario | Votos | Resultado |
|-----------|-------|-----------|
| Empate (1 vs 1) | FOR=1, AGAINST=1 | Rechazada — no ejecuta |
| Mayoría a favor (2 vs 0) | FOR=2, AGAINST=0 | Ejecutada — ETH transferido |
| Mayoría en contra (0 vs 2) | FOR=0, AGAINST=2 | Rechazada — no ejecuta |
| Con cambio de voto | FOR=2 final | Ejecutada |

---

## Notas técnicas

- El contrato requiere `votesFor > votesAgainst` (estrictamente mayor) para ejecutar
- Los votos se cuentan como unidades (1 voto por cuenta), no ponderados por balance
- El cambio de voto funciona gracias a la corrección del nonce en `metaTx.ts` (usa `getReadProvider()` para evitar el lag de bloque de MetaMask)
- Ambas cuentas votan de forma **gasless** — MetaMask solo pide firma, el relayer ejecuta

---

**Estado**: Pendiente de realizar
