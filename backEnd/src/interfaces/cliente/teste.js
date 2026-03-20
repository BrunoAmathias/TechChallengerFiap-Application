const Clienterepository = require('./cliente.repository');

async function testar() {
    try {
    const clienteRepo = new Clienterepository();
    const clientes = await clienteRepo.getAllclientes();
    console.log('Clientes encontrados:');
    console.log(clientes);}
    catch (erro) {
        console.error('Erro ao buscar clientes:', erro);
    }
}

testar();