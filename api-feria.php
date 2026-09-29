<?php
// api-feria.php - Centralized Lead Engine for KEINER FERIA ESPACIO RIESCO 2026
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_file = __DIR__ . '/leads_feria_db.json';
if (!file_exists($db_file)) {
    @file_put_contents($db_file, json_encode([]), LOCK_EX);
}

function get_leads($file) {
    $content = @file_get_contents($file);
    if (!$content) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function save_leads($file, $data) {
    @file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function clean_phone($phone) {
    return preg_replace('/\D/', '', (string)$phone);
}

function detect_device() {
    $ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
    if (strpos($ua, 'ipad') !== false || (strpos($ua, 'android') !== false && strpos($ua, 'mobile') === false)) {
        return 'Tablet';
    }
    if (strpos($ua, 'iphone') !== false || strpos($ua, 'mobile') !== false || strpos($ua, 'android') !== false) {
        return 'Móvil / Celular';
    }
    return 'Escritorio / PC';
}

function generate_ticket_code($leads) {
    $max_num = 0;
    foreach ($leads as $l) {
        $code = $l['ticketCode'] ?? ($l['codigo_unico'] ?? '');
        if (preg_match('/KR-2026-(\d+)/i', $code, $m)) {
            $n = intval($m[1]);
            if ($n > $max_num) $max_num = $n;
        }
    }
    $next_num = max(count($leads) + 1, $max_num + 1);
    return sprintf("KR-2026-%05d", $next_num);
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$pin = $_GET['pin'] ?? $_POST['pin'] ?? '';

$request_uri = $_SERVER['REQUEST_URI'] ?? '';
if (strpos($request_uri, '/canjear') !== false) {
    $action = 'canjear';
} else if (strpos($request_uri, '/clear') !== false) {
    $action = 'clear';
} else if (strpos($request_uri, '/feria-leads') !== false && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = 'get_all';
} else if (strpos($request_uri, '/feria-lead') !== false && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = 'save';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && (empty($action) || $action === 'get_all')) {
    $leads = get_leads($db_file);
    echo json_encode(['ok' => true, 'leads' => $leads]);
    exit;
}

if ($action === 'canjear') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? $_POST;
    $ticketCode = $input['ticketCode'] ?? ($input['codigo_unico'] ?? '');
    $id = $input['id'] ?? '';
    $status = $input['canjeado'] ?? '';
    
    $leads = get_leads($db_file);
    $found = null;
    foreach ($leads as &$l) {
        if (($ticketCode && ($l['ticketCode'] ?? '') === $ticketCode) || ($id && ($l['id'] ?? '') === $id)) {
            $l['canjeado'] = $status ? $status : (($l['canjeado'] ?? 'NO') === 'SI' ? 'NO' : 'SI');
            $found = $l;
            break;
        }
    }
    if ($found) {
        save_leads($db_file, $leads);
        echo json_encode(['ok' => true, 'lead' => $found]);
    } else {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'lead_not_found']);
    }
    exit;
}

if ($action === 'clear') {
    if ($pin !== 'keiner123' && $pin !== 'keiner2026') {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'unauthorized']);
        exit;
    }
    save_leads($db_file, []);
    echo json_encode(['ok' => true, 'message' => 'cleared']);
    exit;
}

// POST: Save lead
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_payload']);
    exit;
}

$leads = get_leads($db_file);

$phone = clean_phone($data['celular'] ?? ($data['telefono'] ?? ''));
$email = strtolower(trim($data['email'] ?? ''));

// Check duplicate by phone or email
$duplicate = null;
foreach ($leads as $l) {
    $lPhone = clean_phone($l['celular'] ?? ($l['telefono'] ?? ''));
    $lEmail = strtolower(trim($l['email'] ?? ''));
    
    if (!empty($phone) && strlen($phone) >= 7 && !empty($lPhone) && strlen($lPhone) >= 7) {
        if (substr($phone, -7) === substr($lPhone, -7) || substr($lPhone, -7) === substr($phone, -7)) {
            $duplicate = $l;
            break;
        }
    }
    if (!empty($email) && strpos($email, '@') !== false && $lEmail === $email) {
        $duplicate = $l;
        break;
    }
}

if ($duplicate) {
    echo json_encode([
        'ok' => true,
        'duplicate' => true,
        'ticketCode' => $duplicate['ticketCode'] ?? $duplicate['codigo_unico'],
        'message' => 'Visitante ya registrado anteriormente. Se mantiene su código asignado.',
        'lead' => $duplicate
    ]);
    exit;
}

$ticketCode = generate_ticket_code($leads);
$nombre = trim(($data['nombre'] ?? '') . ' ' . ($data['apellido'] ?? ''));

$newLead = [
    'id' => (string)($data['id'] ?? (time() . rand(100,999))),
    'ticketCode' => $ticketCode,
    'codigo_unico' => $ticketCode,
    'nombre' => $nombre,
    'apellido' => $data['apellido'] ?? '',
    'celular' => $data['celular'] ?? ($data['telefono'] ?? ''),
    'telefono' => $data['celular'] ?? ($data['telefono'] ?? ''),
    'email' => $data['email'] ?? '',
    'empresa' => $data['empresa'] ?? '',
    'cargo' => $data['tipoContacto'] ?? ($data['cargo'] ?? 'CLIENTE'),
    'tipoContacto' => $data['tipoContacto'] ?? 'CLIENTE',
    'timestamp' => $data['timestamp'] ?? date('c'),
    'fechaLectura' => date('d-m-Y H:i:s'),
    'categorias' => $data['categorias'] ?? ($data['premio'] ?? 'Ruleta Espacio Riesco'),
    'premio' => $data['categorias'] ?? ($data['premio'] ?? 'Ruleta Espacio Riesco'),
    'canjeado' => 'NO',
    'comentarios' => $data['comentarios'] ?? ($data['observaciones'] ?? ''),
    'observaciones' => $data['comentarios'] ?? ($data['observaciones'] ?? ''),
    'dispositivo' => detect_device()
];

array_unshift($leads, $newLead);
save_leads($db_file, $leads);

echo json_encode([
    'ok' => true,
    'ticketCode' => $ticketCode,
    'lead' => $newLead
]);
?>
