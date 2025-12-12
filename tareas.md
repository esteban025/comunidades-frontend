- Al momento de querer invitar a algun hermano en especifico a la convivencia, la logica debe ser ser que se pueda buscar solamente entre las comuniades que no estan yendo a la convivencia o mas bien que no estan invitadas, porque no tiene caso buscar a un hermano en esta modal y me aparezca algun hermano que si dentro de las comunidades invitadas.
- buton de cancelar en modal de invitar hermano no esya funcionando.
- el botton de confirmar dentro de la modal de invitar hermano tambien debe funcionar con el enter.
- una vez que creo una nueva convivencia, el boton de nueva convivencia debe ser disabled para no poder crear una nueva convivencia.
- una vez que finalice la convivencia el botton de nueva convivencia debera ser habilitado

- en los detalles de la comunidad existe un aparatado de total de heramnos y sale no especificado, aqui se debe devolver el total de heramnos que hay en esa comunidad

- El input de cambiar paso de comunidad por el select con pasos.

- en el buscador de registro de hermanos esta buscando solamente en la tabla actual, en la paginacion actual.

- Intentar desabilitar todos los botones que necesitan primero una accion .


## sugerencias
- algun button para confirmar a toda la lista de hermanos de invitados que si van a asistir, por default en el campo de observaciones debe ir vacio

- empezar con la planificacion para designar hospedajes en el futuro.

## casos importantes
- En ocasiones sucede que por ejemplo de una matrimonio solamente fue el esposo o la esposa, entonces en el tema de cobro, se deberia hacer solamente para una persona

- Note que los invitados a la convivencia estan apareciendo en la misma tabla de la parroquia a la que pertenecen pero eso no debe ser asi, por que esten yendo comunidades de la misma parroquia siempre los invitados deben estar en una tabla separada, llamada invitados, y en esa tabla se describiran sus datos por ejemplo de que parroquia son, de que comunidad, el nombre del responsable y una pequenia descripcion, por ejemplo que estan en esa convivencia de oyentes o se estan igualando el paso, etc. Eso en cuanto a la tabla de asistentes.

- Para el caso de cobranzas ahi si que es todo por separado, si por ejemplo solamente un hermano se fue a igualar el paso o lo que sea, entonces vamos a escribir la carta de cobro al responsable de ese hermano diciendo que asistio uno o mas hermanos de su comunidad etc.


## URGENTES
- Quiero lograr lo siguiente porque ya no quiero volver a reiniciar la db, ya que tengo informacion que ya debe permanecer, asi que quiero lograr lo siguiente: 
(No se si algunas ya esten funcionando o no, asi que debes revisar que este correctamente funcionando)

 - VAMOS A TRABAJAR SOLAMENTE CON LA MODAL DE AGREGAR O EDITAR.
  - La funcion de agregar hermano esta funcionando correctamente, siempre y cuando sepa todos los datos necesario, registro todo y todo esta correctamente enviado.
  - Que sucede si no se algunos de los datos del hermano?, estos son los puntos a tener en cuenta cuando no se la informacion completa:

  1. Si es soltero/a ,dedo ser capas de editar:
   - telefono -> lo cual parece estar funcionando correctamente
   - comunidad -> los datos sobre parroquia o numero de comunidad no se pueden editar, si en un caso un hermano quiere editar estos campos, la unica solucion es eliminarse de esa comunidad y registrarse en otra.
   - Los roles -> si va a poder editar
   - Si al editar los roles elige que es catequista, debe ser capaz de editar la parroquia o el numero de comunidad o  de crear una nueva relacion.
   - Si anteriormente ya se registro como catequista, puede elimnar o dejar de ser catequista de alguna parroquia o de todas, actualizando asi la informacion en todas las tablas de la db correspondientes.
   - Si anteriormente ya registrado como catequista y decide quitar el check de catequista, debemos eliminar la informacion de la parroquia o de todas las parroquias, actualizando asi la informacion en todas las tablas de la db correspondientes.

   2. Si es matrimonio, debe ser capaz de editar:
   - Telefono -> lo cual parece funcionar correctamente.
   - comunidad -> los datos sobre parroquia o numero de comunidad no se pueden editar, si en un caso un hermano quiere editar estos campos, la unica solucion es eliminarse de esa comunidad y registrarse en otra.
   - Pueden elegir nuevos roles y si obviamente estos cambios de roles es para ambos, SIEMPRE. Si el esposo decide cambiar que ahora es corresponsable, entonces la esposa tambien lo es.
   - Si decide eligir que es catequista y no agrega ninguna parroquia ni numero de comunidad, debemos ser capaces de guardar el rol como catequista pero no asignarle ninguna parroquia ni comunidad, pero cuando quiera editar este campo puede hacerlo agregar o eliminar parroquia o numero de comunidad.
   - SIEMPRE EL CAMBIO QUE HAGA EL ESPOSO EN LOS ROLES, SE HARIA PARA AMBOS, SIEMPRE.