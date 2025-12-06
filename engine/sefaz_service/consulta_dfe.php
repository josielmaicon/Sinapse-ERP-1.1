<?php

error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 0);
ini_set('log_errors', 0);

require __DIR__ . '/vendor/autoload.php';

use NFePHP\NFe\Tools;
use NFePHP\Common\Certificate;

$chave   = $argv[1] ?? null;
$pfxPath = $argv[2] ?? null;
$senha   = $argv[3] ?? null;
$cnpj    = $argv[4] ?? null;
$prod    = ($argv[5] ?? "1") === "1";

try {
    if (!$chave || !$pfxPath || !$senha || !$cnpj) {
        throw new Exception("Parâmetros insuficientes");
    }

    if (!file_exists($pfxPath)) {
        throw new Exception("Certificado PFX não encontrado no caminho recebido.");
    }

    $certContent = @file_get_contents($pfxPath);
    if (!$certContent) {
        throw new Exception("Falha ao ler certificado PFX.");
    }

    // Lê certificado
    $certificate = Certificate::readPfx($certContent, $senha);

    // Config NFePHP
    $config = [
        "atualizacao" => "2024-01-01",
        "tpAmb" => $prod ? 1 : 2,
        "razaosocial" => "EMPRESA",
        "cnpj" => $cnpj,
        "siglaUF" => "PR",
        "schemes" => "PL_009_V4",
        "versao" => "4.00",
        "tokenIBPT" => "",
        "pathCerts" => __DIR__ . "/storage"
    ];

    if (!is_dir($config["pathCerts"])) {
        mkdir($config["pathCerts"], 0777, true);
    }

    $tools = new Tools(json_encode($config), $certificate);

    // Consulta por chave
    $response = $tools->sefazConsultaChave($chave);

    echo json_encode([
        "status" => "ok",
        "raw_xml" => $response,
        "xml_base64" => base64_encode($response)
    ]);
    exit(0);

} catch (Exception $e) {

    echo json_encode([
        "status" => "error",
        "error" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
    exit(1);
}
