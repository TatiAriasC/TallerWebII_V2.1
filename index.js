//Librerias externas
const express = require('express');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
const PDFDocument = require('pdfkit');

//Modulos internas
const { readFile, writeFile } = require('./src/files');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || 'My App';
const FILE_NAME = './db/carros.txt';
const LOG_FILE_NAME = 'access_log.txt';

//Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('views', './src/views');
app.set('view engine', 'ejs') //DEBEMOS CREAR LA CARPETA

app.get('/read-file', (req, res)=>{
    const data = readFile(FILE_NAME);
    res.send(data);
})

//PDF CARROS
app.get('/pdf/:id', (req, res) => {

    console.log(req.params.id);
    const id = req.params.id
    const cars = readFile(FILE_NAME)

    //BUSCAR EL CARRO CON EL ID QUE RECIBE
    const carro = cars.findIndex(carro => carro.id === id)
    if (!carro) {
        return res.status(404).send('Registro no encontrado');
      }
  
    const doc = new PDFDocument();
  
    // Configura el encabezado y el nombre del archivo PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${carro.id}.pdf"`);
  
    // Escribe el contenido del PDF
    doc.pipe(res);
    doc.text(`ID: ${carro.id}`);
    doc.text(`MARCA: ${carro.marca}`);
    doc.text(`LINEA: ${carro.linea}`);
    doc.text(`MODELO: ${carro.modelo}`);
    doc.text(`COLOR: ${carro.color}`);
    doc.text(`FECHA DE COMPRA: ${carro.compra}`);
    doc.end();
  });

//WEB LISTAR CARROS
app.get('/carros', (req, res) => {
    const data = readFile(FILE_NAME);
    const filtro = req.query.filtro;

    if (filtro) {
        // Filtrar registros por la clave y valor especificados en el query param
        const registrosFiltrados = data.filter((registro) => {
          return registro.marca.includes(filtro); // Cambia "tipo" al nombre de la clave que quieras filtrar
        });
        res.render('carros/index', { carros: registrosFiltrados });
      } else {
        // Si no se proporciona un valor para el query param, enviar todos los registros
        //res.json(data);
        res.render('carros/index', { carros: data });
      }

    const currentTime = new Date().toISOString();
    const logEntry = `${currentTime} [GET] ListarCarros /carros`;
    
    fs.appendFile(LOG_FILE_NAME, logEntry + '\n', (err) => {
        if (err) {
            console.error('Error al escribir en el archivo de registro.', err);
        }
    });
});


//WEB CREAR CARRO
app.get('/carros/create', (req,res) =>{
    //Mostrar el formulario
    res.render('carros/create');
})

app.post('/carros', (req,res) =>{
    try{
        //Leer el archivo de carros
        const data = readFile(FILE_NAME);
    
        //Agregar el nuevo registro
        const newCar = req.body;
        newCar.id = uuidv4();
        console.log(newCar)
        data.push(newCar); //agrego nuevo elemento
        //Escribir en el archivo
        writeFile(FILE_NAME, data);
        res.redirect('/carros')
    } catch (error){
            console.error(error);
            res.json({message: ' Error al almacenar el carro'});
        }

        const currentTime = new Date().toISOString();
        const logEntry = `${currentTime} [POST] CrearCarro /carros`;
        
        fs.appendFile(LOG_FILE_NAME, logEntry + '\n', (err) => {
            if (err) {
                console.error('Error al escribir en el archivo de registro.', err);
            }
        });
});

//WEB ELIMINAR CARRO
app.post('/carros/Delete/:id', (req, res) =>{
    console.log(req.params.id);
    //GUARDAR ID
    const id = req.params.id
    //leer contenido del archivo
    const cars = readFile(FILE_NAME)

    //BUSCAR EL CARRO CON EL ID QUE RECIBE
    const carroIndex = cars.findIndex(carro => carro.id === id)
    if(carroIndex < 0){
        res.status(404).json({'ok': false, message:"car not found"})
        return;
    }
    //eliminar el carro en la posicion
    cars.splice(carroIndex,1);
    writeFile(FILE_NAME, cars)
    res.redirect('/carros');

    const currentTime = new Date().toISOString();
    const logEntry = `${currentTime} [DELETE] EliminarCarro /carros/Delete/id: `;
    
    fs.appendFile(LOG_FILE_NAME, logEntry + id + '\n', (err) => {
        if (err) {
            console.error('Error al escribir en el archivo de registro.', err);
        }
    });
});


//API
//Listar Carros
app.get('/api/carros', (req,res) =>{
    
    const data = readFile(FILE_NAME);
    const filtro = req.query.filtro;

    if (filtro) {
        // Filtrar registros por la clave y valor especificados en el query param
        const registrosFiltrados = data.filter((registro) => {
          return registro.marca.includes(filtro); // Cambia "tipo" al nombre de la clave que quieras filtrar
        });
    
        res.json(registrosFiltrados);
      } else {
        // Si no se proporciona un valor para el query param, enviar todos los registros
        res.json(data);
      }

    const currentTime = new Date().toISOString();
    const logEntry = `${currentTime} [GET] ListarCarrosAPI /carros`;
    
    fs.appendFile(LOG_FILE_NAME, logEntry + '\n', (err) => {
        if (err) {
            console.error('Error al escribir en el archivo de registro.', err);
        }
    });
});


//Crear carro
app.post('/api/carros', (req, res) => {
    try{
    //Leer el archivo de mascotas
    const data = readFile(FILE_NAME);

    //Agregar el nuevo carro
    const newCar = req.body;
    newCar.id = uuidv4();
    console.log(newCar)
    data.push(newCar); //agrego nuevo elemento
    //Escribir en el archivo
    writeFile(FILE_NAME, data);
    res.json({message: 'El carro fue creado'});
    }catch (error){
        console.error(error);
        res.json({message: ' Error al almacenar el registro'});
    }

});

//Obtener un solo carro (usamos los dos puntos por que es un path param)
app.get('/api/carros/:id', (req, res) =>{
    console.log(req.params.id);
    //GUARDAR ID
    const id = req.params.id
    //leer contenido del archivo
    const cars = readFile(FILE_NAME)

    //BUSCAR EL CARRO CON EL ID QUE RECIBE
    const petFound = cars.find(carro => carro.id === id)
    if(!petFound){
        res.status(404).json({'ok': false, message:"Car not found"})
        return;
    }

    res.json({'ok': true, pet: petFound});
})

//ACTUALIZAR UN DATO
app.put('/api/cars/:id', (req, res) =>{
    console.log(req.params.id);
    //GUARDAR ID
    const id = req.params.id
    //leer contenido del archivo
    const cars = readFile(FILE_NAME)

    //BUSCAR EL CARRO CON EL ID QUE RECIBE
    const carIndex = cars.findIndex(car => car.id === id)
    if(carIndex < 0){
        res.status(404).json({'ok': false, message:"Car not found"})
        return;
    }
    let car = cars[carIndex]; //sacar del arreglo
    car={...car, ...req.body}
    cars[carIndex] = car //Poner EL CARRO en el mismo lugar
    writeFile(FILE_NAME, cars);
    //SI EL CARRO EXISTE MODIFICAR LOS DATOS Y ALMACENAR NUEVAMENTE
    res.json({'ok': true, car: car});
})

//Delete, eliminar un dato
app.delete('/api/cars/:id', (req, res) =>{
    console.log(req.params.id);
    //GUARDAR ID
    const id = req.params.id
    //leer contenido del archivo
    const cars = readFile(FILE_NAME)

    //BUSCAR EL CARRO CON EL ID QUE RECIBE
    const carIndex = cars.findIndex(car => car.id === id)
    if(carIndex < 0){
        res.status(404).json({'ok': false, message:"Car not found"})
        return;
    }
    //eliminar el carro en la posicion
    cars.splice(carIndex,1);
    writeFile(FILE_NAME, cars)
    res.json({'ok': true});
})

//EJECUCIÓN DEL SERVIDOR
app.listen(3000, () => {
    console.log(`${APP_NAME} está corriendo en http://localhost:${PORT}`);
});