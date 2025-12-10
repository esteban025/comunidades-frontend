# Cobros

## Cosas a tener en cuenta

- Antes de aplicar algun costo por cada hermanos para el tema de la convivencia necesitamos saber quienes realmente si fueron, porque una cosa es que confirmen que si van y otra que terminen yendo.
- De todos los hermanos que han confirmado que van tengo ver quien realmente si fue, o quien de los que no confirmaron si fueron, entonces esto tengo que gestionar al ultimo dia de la convivencia.


## Como funciona el tema de los costos
- Cada hermano inicialmente debera pagar por ejemplo un costo de $65 por cada uno (hijos o ninios no cuentan).
- Al final de la convivencia se pedira este dinero por comunidad, si fueron por ejemplo dos comunidades, se haran dos colectas cada una perteneciente a cada comunidad.
- Entonces si fueron 10 hermanos a la convivencia en cada comunidad, cada comunidad tendra que pagar $650, pero al hacer la colecta resulta que solamente sale $400, entonces el dinero faltante se repatira entre todos los hermanos de esa comunidad que asistieron a la convivencia.
- El costo de la convivencia no depende del hospedaje ya que siempre se pagara ese valor incial para todos.
- por esta semana nos vamos a olvidar del tema del Hospedaje ya que todos iran al mismo sitio que se llama "Seminario Javier Loyola".

## Propuestas para este sistema

<!-- === TODO ESTO ANTES DEL ASIGNAR COBROS -->
- Despues de tener la lista completa de quienes hayan confirmado que asistiran deseo imprimir esta lista separado por comunidades.
- Necesito algun boton que me permita dirigirme a una nueva pagina /asitentes-confirmados.
- en esta nueva pagina se debe recibir el nombre de la convivencia la fecha, y toda lista de asitentes, en esta pagina vamos a separar a los asistentes ya sea por parroquias o por comunidades, por ejemplo:
  - Si a la convivencia asistieron comunidades de una sola parroquia entonces vamos a separar la lista por comunidades, entonces devolvera lo siquiente: 
    - titulo: Convivencia de Transimicion - 2025
    - subtitlo: Comunidad de Pablo Astudillo - Quinta Chica
    - lista de esa comunidad.
  - Si a la convivencia asistieron comunidades de varias parroquias entonces vamos a separar la lista por parroquias e internamente por comunidades, ejemplo:
    - titulo: Convivencia de Transimicion - 2025
    - subtitlo: Parroquia de San Isidro
    - lista de comunidades de esta parroquia.
      - lista de comunidad 1: Angel Mendez
      - lista de comunidad 2
    - subtitlo: Parroquia de San Isidro
    - lista de comunidades de esta parroquia.
- Tambien necesito una funcionalidad en la que pueda imprimir alguna comunidad de asistentes en especifico, por ejemplo:
  - titulo: Convivencia de Transimicion - 2025
  - subtitlo: Comunidad de Pablo Astudillo - Quinta Chica
  - lista de asistentes de esta comunidad.
- En el caso de invitados, se hara una lista solo de invitados con los datos de cada hermanos, su nombre, nombre de la parroquia etc.


<!-- === DESPUES DE HABER SISTIDO A LA CONVIVENCIA -->
- una vez finalizada la convivencia sabremos cuanto esta debiendo cada hermano de cada comunidad por lo que necesito otra funcionalidad para dirigirme a /cobros en donde se recibira la informacion especifica de cada comunidad, entonces esta pagina deberia recibir nombre de la convivencia, la parroquia a la pertenece la comunidad, el nombre del responsable y la lista con todos los que asistieron a la conviencia, esta lista ya debe ser definitiva despues de haber confirmado ya quienes si fueron o no a la convivencia, 

## Resolviendo dudas
1. En la misma pagina en donde se veran todos los asitentes confirmado y me permita imprirmir esa lista para primera vista, esa misma pagina servira para nuevamente marcar a los que realemnte si fueron, entonces tendremos un ultimo boton para enviar esa lista al sistema de cobros, por eso te decia dos paginas.

2. En cuanto a las tablas en la base de datos no se como hacerlo o crear una nueva modificacion en la tabla nose que seria mejor, o yo pienso que deberiamos agregar una nueva columna que diga si asistio, por defecto sera false y una vez que confirmemos en la pagina que si asistieron, enviaremos este dato a true, que dices?