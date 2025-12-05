# COMUNIDADES DATABASE

## OBJETIVO
El objetivo de este proyecto es crear un base de datos con la informacion necesaria para llevar un registro de los hermanos que existen dentro de las comunidades en el camino neocatecumenal en cuenca.

## LOGRAR
Quiero crear una base de datos local, en mysql en donde pueda tener un registro de todos hermanos que hay dentro de las comunidades dentro de cada parroquia en Cuenca.

## Especificaciones o estructura pensada

Dentro de cuenca existen algunas parroquias, en alguna de ellas existen multiples comunidades del camino neo..

- Cada parroquia tiene sus propias comunidades.
- Cada Comunidad contiene:
  - Un numero de comunidad.
  - Catequistas que iniciaron esta comunidad.
  - Un responsable que esta al frente de la comunidad.
  - Un grupo de responsables de la comunidad, en los cuales ya incluye el resoponsable y los corresponsables.
  - En el mayor de los casos el responsable es un matrimonio.
  - Los corresponsables son dos matrimonios, un soltero y una soltera.
  - Una didascada o dos. 
  - Un ostiario o dos.

- Todos los anios cada comunidad hace una convivencia o un retiro espiritual.
- Primero: los catequistas a nivel nacional transmiten la convivencia a los catequistas de todas las comunidades. 
- Segundo: Despues algunos catequistas son los encargados de transmitir esta convivencia a los responsables de las comunidades.
- Tercero: Los resposnables posteriormente transmiten al resto de los hermanos en las comunidades

## Importante

- Solamente quiero llevar un registro superficial, por ejemplo no quiero nada de edades, etc.

- Entonces necesitaria por cada comunidad:
 - A que parroquia pertenece
 - Cauales son sus catequistas
 - Cual es el grupo de responsables
 - Cual es su numero de comunidad


## Respondiendo tus dudas
1. No necesito mas informacion de la parroquia que el nombre
2. Son como 6 parroquias en total
3. Un nombre un apellido de cada hermano
4. Podria tener un tipo estado civil para identificarlo, ademas ninguna persona tendra acceso a esta informacion ni para verla ni para modificarla, este es un proyecto que estara simplemente en mi localhost, asi que al yo agregar a alguien controlo que los datos se envien correctamente, por eso digo, que cada insert por ejemplo tendra un tipo que sea matrimonio, soltero o soltera.
5. Un hermano pertenece siempre a una sola comunidad.
6. Si, por ejemplo de una comunidad de 30 hermanos, solo 6 u 8 perteneces al grupo de responsables, el resto no tienen ningun rol.
7. Si un catequsta puede servir a multiples comunidad. Algo importante aqui tambien que no solo es un matrimonio de catequista si no un grupo de catequistas por cada comunidad, mayormente 3 matrimonios para cada comunidad, y si, estos pueden servir multiples comunidades, de hecho pueden servir en otras parroquias tambien.
8. No, los catequistas que iniciaron, son los actuales.
9. Estos roles pueden ser ya sea matrimonio o solteros.
10. Los roles si pueden cambiar con el tiempo, pero no necesito un historial de quien haya sido anteriormente.
11. no
12. no


- De aqui en adelante es lo que quiero ir organizando porque posteriormente se vienen las convivencias de transimicion de los responsables al resto de hermanos, entonces quiero lograr llevar un resgistro de los hermanos que van asistir a esta convivencia para poder registrarlos en diferentes hoteles y al final de la convivencia poder cobrar cierta cantidad de dinero por cada comunidad, pero esto ya puede ser sistema del backend, por lo que yo hago quiero llevar un registro mas de los hermanos para facilitar la lectura del backend, me hago entender?

## Nuevas dudas
1. no me hace falta saber quien con quien, es mas en un solo registro estaran los nombres de ambos, ejemplo: {nombres: 'juan cabrera y maria pinos', estadocivil:'matrimonio'}, mas o menos esa es la idea.
2. sera registrado como {responsables: 'juan cabrera y maria pinos'}
3. Si exactamente 3 matrimonios.
4. Los catequistas tambien tienen su propia comunidad.
5. no nos compliquemos, siempre sera una sola persona o dos, pero solteros.
6. si necesito un numero de telefono de los responsables de la comunidad, ya sea del esposo o de la esposa, pero igualmente sera opcional.
7. Todos iran a la convivencia, o claro precisamente de eso se trata, habran algunos hermanos que no puedan ir a la convivencia o cosas asi, pero ya digo de esto me preoupo en el backend.
8. Si
9. Incluye solamente a responsables y corresponsables, didascalas y ostiarios estan fuera de ese grupo

## Ultimas Aclaraciones
1. Si exactamente.
2. si obviamente, la comunidad se compone por responsable, corrsponsables, disdaslas y ostiarios donde responsables y corresponsables forman el grupo encargado.
3. Opcion A. un solo registro con nombres concadenados.