# Fichas técnicas y fallos de los componentes

## Alcance y cómo leer estas fichas

Este documento cubre los componentes del catálogo de la galería y la protoboard disponible en la biblioteca de simulación. El catálogo no asigna número de parte ni fabricante a la mayoría de los componentes. Por eso se distinguen:

- **Parámetros del modelo:** valores con los que el simulador instancia la pieza.
- **Límite físico documentado:** valor publicado por el fabricante de una pieza identificada.
- **Pendiente de validar:** dato que depende del número de parte, variante o montaje real.

Los fallos descritos son modos habituales de fallo físico y sus síntomas esperables. El simulador educativo no implementa necesariamente esos fallos. Un valor nominal tampoco equivale a un rango de alimentación permitido ni a un máximo absoluto.

## Resumen de parámetros del catálogo

| Componente | Parámetros iniciales del catálogo |
|---|---|
| Fuente DC | 9 V; corriente máxima no limitada en la instancia (`Infinity`) |
| Motor DC | 6 V nominales; 70 mA sin carga; 9000 rpm sin carga; 1.2 A de bloqueo |
| Zumbador activo | 5 V nominales; 30 mA nominales |
| Potenciómetro | 10 kΩ; posición 50 % |
| Pulsador | Contacto normalmente abierto (NO); sin presionar |
| Interruptor | Abierto inicialmente |
| Resistor | 1 kΩ; tolerancia 5 %; potencia nominal 0.25 W |
| Capacitor | 100 µF; 25 V; polarizado; ESR modelada de 0 Ω |
| Inductor | 10 mH; resistencia serie de 2 Ω; corriente máxima no especificada |
| Diodo | Caída directa nominal de 0.7 V; corriente máxima de 1 A; tensión inversa máxima modelada de 50 V |
| LED rojo | Caída directa modelada de 2 V; corriente directa máxima de 20 mA |
| Transistor BJT | NPN; beta DC de 100; corriente máxima de colector modelada de 0.2 A; VCE máxima modelada de 40 V; VBE nominal de 0.7 V |
| LDR | 10 kΩ a 10 lx; gamma 0.7; iluminación inicial de 10 lx |
| Sensor ultrasónico | Distancia inicial de 50 cm; rango de medición modelado de 2 a 400 cm |
| Protoboard | 30 filas, dos grupos de cinco contactos por fila y cuatro rieles de alimentación |

## Fichas por componente

### Fuente de voltaje DC

- **Función:** establece una diferencia de potencial entre los terminales positivo y negativo.
- **Parámetros del modelo:** 9 V iniciales. La instancia del catálogo no limita la corriente máxima; la clase acepta cualquier tensión finita, incluso negativa.
- **Fallos y comportamiento:**
  - **Salida abierta o protección activada:** la tensión cae a 0 V y el circuito deja de recibir alimentación.
  - **Cortocircuito interno:** la protección puede limitar o cortar la salida; una fuente sin protección puede sobrecalentarse o dañarse.
  - **Regulación defectuosa:** la tensión fluctúa, provocando reinicios, lecturas inestables o daño en componentes sensibles.
- **Tensión aceptada:** el modelo de software acepta cualquier número finito, pero esto no define el rango seguro de una fuente real. Falta fabricante y modelo de fuente para validar tensión, corriente, polaridad y protección.

### Motor DC

- **Función:** convierte energía eléctrica en rotación.
- **Parámetros del modelo:** 6 V nominales, 70 mA sin carga, 9000 rpm sin carga y 1.2 A de corriente de bloqueo.
- **Fallos y comportamiento:**
  - **Bobinado abierto:** no circula corriente y el motor no gira.
  - **Espiras en corto:** aumenta la corriente, baja el par o la velocidad y se genera calor.
  - **Eje bloqueado o carga excesiva:** el motor se detiene; la corriente puede acercarse a la corriente de bloqueo y causar calentamiento rápido.
  - **Escobillas o rodamientos desgastados:** arranque irregular, ruido, chispas o pérdida de velocidad.
- **Tensión aceptada:** 6 V es el valor nominal del modelo, no un rango físico confirmado. Se requiere el número de parte para validar tensión, corriente de bloqueo, ciclo de trabajo y disipación.

### Zumbador activo

- **Función:** genera un tono al recibir alimentación DC con la polaridad adecuada.
- **Parámetros del modelo:** 5 V nominales y 30 mA nominales.
- **Fallos y comportamiento:**
  - **Circuito interno abierto:** no suena.
  - **Corto interno:** demanda corriente excesiva y puede hacer caer la tensión de alimentación.
  - **Oscilador o transductor dañado:** sonido débil, distorsionado o ausente.
- **Tensión aceptada:** el catálogo solo indica 5 V nominales. No se puede asignar un intervalo mínimo/máximo sin la ficha del zumbador exacto.

### Potenciómetro

- **Función:** resistor variable; el cursor divide la resistencia entre sus extremos.
- **Parámetros del modelo:** 10 kΩ totales, posición inicial de 50 %.
- **Fallos y comportamiento:**
  - **Pista abierta o rota:** se pierde la continuidad entre extremos o entre cursor y pista.
  - **Cursor sucio/desgastado:** la resistencia cambia a saltos; la salida puede tener ruido o interrupciones.
  - **Sobrecalentamiento:** deriva del valor, daño de la pista o circuito abierto.
- **Tensión aceptada:** no está especificada. Depende de potencia, tensión máxima de trabajo, corriente de cursor y tipo de pista del modelo físico. Como referencia, la familia Vishay P10 publica límites propios por resistencia y versión; no deben extrapolarse a un potenciómetro genérico ([ficha Vishay P10](https://www.vishay.com/docs/51030/p10.pdf)).

### Pulsador

- **Función:** abre o cierra un contacto mientras se acciona.
- **Parámetros del modelo:** contacto NO; abierto cuando está suelto y cerrado cuando se presiona.
- **Fallos y comportamiento:**
  - **Contacto abierto permanentemente:** no responde al pulsarlo.
  - **Contacto soldado:** permanece cerrado aunque se suelte.
  - **Contacto contaminado o desgastado:** conmuta de forma intermitente o presenta resistencia elevada.
- **Tensión aceptada:** no está especificada. Depende del rating DC, la corriente y la carga inductiva/capacitiva del pulsador. No usar un rating AC como sustituto del rating DC.

### Interruptor

- **Función:** mantiene un circuito abierto o cerrado.
- **Parámetros del modelo:** abierto inicialmente.
- **Fallos y comportamiento:**
  - **Contacto abierto:** el circuito no conduce aunque el interruptor esté en posición de cerrado.
  - **Contacto soldado:** el circuito permanece cerrado.
  - **Oxidación o desgaste:** caída de tensión, calentamiento o funcionamiento intermitente.
- **Tensión aceptada:** no está especificada para el interruptor del catálogo. Los ratings varían mucho por modelo. Por ejemplo, la familia Omron D2F ofrece variantes con diferentes ratings DC, por lo que se debe consultar el código completo de la pieza ([ficha Omron D2F](https://components.omron.com/us-en/system/files/2023-01/datasheet_pdf/B036-E1.pdf)).

### Resistor

- **Función:** limita corriente y produce una caída de tensión.
- **Parámetros del modelo:** 1 kΩ, tolerancia 5 %, potencia nominal 0.25 W.
- **Fallos y comportamiento:**
  - **Sobrecarga térmica:** se calienta; el valor puede derivar y finalmente abrirse.
  - **Abierto:** interrumpe la rama.
  - **Corto:** deja de limitar la corriente y puede dañar otros componentes.
- **Tensión aceptada:** la potencia del modelo permite calcular un límite térmico ideal de `V = √(P × R)`, aproximadamente **15.8 V** para 0.25 W y 1 kΩ. Es un cálculo de potencia, no el rating de tensión de trabajo del resistor; ese límite puede ser menor y requiere la ficha exacta.

### Capacitor

- **Función:** almacena carga y puede filtrar variaciones de tensión.
- **Parámetros del modelo:** 100 µF, 25 V, polarizado; ESR modelada de 0 Ω.
- **Fallos y comportamiento:**
  - **Circuito abierto o capacitancia reducida:** pierde capacidad de filtrado o temporización.
  - **Fuga o corto:** aumenta el consumo, calienta el capacitor o hace caer la tensión de la fuente.
  - **ESR elevada:** aumenta el rizado y la temperatura.
  - **Polaridad invertida o sobretensión:** puede causar fuga, hinchamiento, venteo o ruptura.
- **Tensión aceptada:** el modelo declara **25 V**. Para la pieza real, mantener la polaridad correcta y operar por debajo de la tensión nominal; validar además corriente de rizado y temperatura. Como referencia compatible en capacitancia y tensión, KEMET publica una pieza de 100 µF y 25 V DC ([ficha KEMET EDK](https://search.kemet.com/component-documentation/download/specsheet/EDK107M025A9HAA)).

### Inductor

- **Función:** almacena energía en un campo magnético y se opone a cambios de corriente.
- **Parámetros del modelo:** 10 mH y 2 Ω de resistencia serie. El modelo no establece corriente máxima.
- **Fallos y comportamiento:**
  - **Bobinado abierto:** interrumpe el circuito.
  - **Espiras en corto:** disminuye la inductancia y aumenta el calentamiento.
  - **Saturación del núcleo:** cae la inductancia efectiva y la corriente puede crecer con rapidez.
  - **Aislamiento degradado:** fuga o arco entre espiras/terminales.
- **Tensión aceptada:** no hay tensión nominal ni corriente de saturación declaradas. La tensión depende del aislamiento del componente y la corriente del núcleo/bobinado; hacen falta número de parte y condiciones de operación.

### Diodo rectificador

- **Función:** conduce principalmente en sentido ánodo-cátodo y bloquea en sentido inverso.
- **Parámetros del modelo:** caída directa nominal de 0.7 V, corriente máxima de 1 A y tensión inversa máxima de 50 V.
- **Fallos y comportamiento:**
  - **Abierto:** no conduce ni siquiera en polarización directa.
  - **Corto:** conduce en ambas direcciones y puede provocar una sobrecorriente.
  - **Ruptura inversa:** al exceder su tensión inversa máxima puede aumentar la fuga y quedar en corto o abierto.
- **Tensión aceptada:** el modelo marca 50 V como límite inverso y 1 A como límite de corriente. Estos valores coinciden con el orden de magnitud de un 1N4001; la ficha Vishay especifica `VRRM = 50 V` e `IF(AV) = 1 A` para esa referencia ([ficha Vishay 1N4001–1N4007](https://www.vishay.com/docs/88503/1n4001.pdf)). La caída directa de 0.7 V es nominal, no una tensión de alimentación.

### LED rojo

- **Función:** emite luz cuando circula corriente en sentido ánodo-cátodo.
- **Parámetros del modelo:** color rojo, caída directa modelada de 2 V y corriente directa máxima de 20 mA.
- **Fallos y comportamiento:**
  - **Abierto:** queda apagado.
  - **Corto:** no emite luz y deja de limitar la corriente.
  - **Exceso de corriente o temperatura:** disminuye el brillo con el tiempo o se daña de forma permanente.
- **Tensión aceptada:** 2 V es la caída directa aproximada del modelo, no el voltaje que debe aplicarse directamente. Se requiere resistencia limitadora o controlador de corriente. LITEON publica LEDs rojos con caídas directas en torno a 2 V a 20 mA, pero el rango depende del modelo concreto ([ficha LITEON LTST-010VEKT](https://optoelectronics.liteon.com/upload/download/DS22-2016-0382/LTST-010VEKT.PDF)).

### Transistor BJT

- **Función:** puede amplificar o funcionar como interruptor controlado por corriente de base.
- **Parámetros del modelo:** NPN, beta DC 100, corriente máxima de colector modelada de 0.2 A, VCE máxima modelada de 40 V y VBE nominal de 0.7 V.
- **Fallos y comportamiento:**
  - **Unión abierta:** no hay corriente de base/colector y el transistor no conmuta.
  - **Unión en corto:** puede conducir permanentemente o presentar una fuga alta.
  - **Ganancia degradada:** la carga requiere más corriente de base o deja de activarse.
  - **Sobrecalentamiento o exceso de VCE/IC:** puede causar fuga, cortocircuito o circuito abierto.
- **Tensión aceptada:** **40 V VCE** y **0.2 A de colector** son límites del modelo del simulador, no una ficha de fabricante de una pieza identificada. Como ejemplo de por qué debe comprobarse el código exacto, el 2N2222A de onsemi especifica 50 V de VCEO y hasta 800 mA de corriente continua bajo sus condiciones de ficha ([ficha onsemi 2N2222A](https://www.onsemi.com/download/data-sheet/pdf/2n2222a-d.pdf)). No se deben sustituir los límites de una referencia por los de otra.

### LDR (fotorresistencia)

- **Función:** cambia su resistencia en función de la iluminación; en el modelo, más luz reduce la resistencia.
- **Parámetros del modelo:** 10 kΩ a 10 lx, gamma 0.7, iluminación inicial 10 lx y mínimo de cálculo de 0.01 lx.
- **Fallos y comportamiento:**
  - **Abierta:** la rama queda sin conducción.
  - **Corto:** presenta resistencia muy baja y deja de responder normalmente a la luz.
  - **Envejecimiento, suciedad o daño óptico:** deriva de resistencia o sensibilidad reducida.
- **Tensión aceptada:** no está especificada; las LDR se seleccionan también por disipación y tensión máxima del material/contactos. Hace falta el número de parte y su ficha para validar tensión y potencia.

### Sensor ultrasónico

- **Función:** envía un pulso ultrasónico y estima distancia por el tiempo que tarda en regresar el eco.
- **Parámetros del modelo:** rango de 2 a 400 cm y distancia inicial de 50 cm.
- **Fallos y comportamiento:**
  - **Sin alimentación o GND desconectado:** no produce una medición válida.
  - **TRIG defectuoso:** no inicia la medición.
  - **ECHO atascado o sin eco:** entrega distancia cero, fuera de rango o una lectura que agota el tiempo de espera.
  - **Transductor dañado o montaje inadecuado:** lecturas inestables o alcance reducido.
- **Tensión aceptada:** el simulador no fija alimentación para este modelo lógico. La guía de ELECFREAKS para el módulo HC-SR04 indica alimentación de **5 V DC** y alcance de 2–400 cm; el documento no especifica una tolerancia de alimentación. Por eso debe usarse 5 V para esa variante documentada y confirmarse la ficha del módulo recibido ([guía ELECFREAKS HC-SR04](https://hetpro-store.com/PDFs/HC-SR04.pdf)).

### Protoboard

- **Función:** permite construir conexiones temporales sin soldadura. En esta implementación, cada fila conecta a–e y f–j por separado; los rieles están modelados a lo largo de toda la placa.
- **Fallos y comportamiento:**
  - **Contacto flojo o deformado:** conexión intermitente, caída de tensión o circuito abierto.
  - **Tira interna dañada:** se pierde continuidad en parte de una fila o riel.
  - **Cable o componente insertado en filas incorrectas:** circuito abierto o cortocircuito accidental.
  - **Exceso de corriente:** los contactos se calientan, pierden presión o se dañan.
- **Tensión aceptada:** la clase de software no declara límite eléctrico. La tensión/corriente permitida depende del fabricante, el material y el estado de los contactos; no aplicar tensión de red ni cargas de potencia sin una placa con rating adecuado.

## Fuentes consultadas

- [Vishay — diodos rectificadores 1N4001 a 1N4007](https://www.vishay.com/docs/88503/1n4001.pdf)
- [KEMET — capacitor electrolítico EDK, 100 µF, 25 V](https://search.kemet.com/component-documentation/download/specsheet/EDK107M025A9HAA)
- [LITEON — LED rojo LTST-010VEKT](https://optoelectronics.liteon.com/upload/download/DS22-2016-0382/LTST-010VEKT.PDF)
- [onsemi — transistor 2N2222A](https://www.onsemi.com/download/data-sheet/pdf/2n2222a-d.pdf)
- [Omron — microswitch D2F](https://components.omron.com/us-en/system/files/2023-01/datasheet_pdf/B036-E1.pdf)
- [Vishay — potenciómetro P10](https://www.vishay.com/docs/51030/p10.pdf)
- [ELECFREAKS — guía del módulo ultrasónico HC-SR04](https://hetpro-store.com/PDFs/HC-SR04.pdf)

## Datos que faltan para cerrar la validación física

Para declarar rangos seguros de hardware hay que identificar las piezas concretas, especialmente fuente, motor, zumbador, potenciómetro, pulsador, interruptor, resistor, inductor, LDR y protoboard. Los límites modelados ayudan a simular, pero no sustituyen los ratings eléctricos, térmicos y de corriente de las fichas de esos componentes.
