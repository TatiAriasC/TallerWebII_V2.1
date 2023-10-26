appl.post('/carros', (req, res) => {
    try{
        const data = readFile(FILE_NAME);
        console.log(req.body)
        data.push(req.body);

        FileSystemWritableFileStream(FILE_NAME, data);
        res.json ({message: 'La mascota fue creada con exito'});
    }catch (error){
        console.error(error);
        res.json({message: 'Error al al almacenar la mascota'});
    }
});