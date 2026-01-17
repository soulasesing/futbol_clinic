#!/bin/bash

# ============================================
# Script Helper para Desarrollo - Futbol Clinic
# ============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones helper
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   Futbol Clinic - Dev Helper Script   ║"
echo "╔════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

print_success "Docker está corriendo"

# Función: Iniciar desarrollo
start_dev() {
    print_info "Iniciando servicios de desarrollo..."
    docker-compose -f docker-compose.dev.yml up --build
}

# Función: Iniciar en background
start_dev_bg() {
    print_info "Iniciando servicios en background..."
    docker-compose -f docker-compose.dev.yml up -d --build
    sleep 5
    print_success "Servicios iniciados en background"
    print_info "Ver logs: ./dev.sh logs"
    print_info "Detener: ./dev.sh stop"
}

# Función: Detener servicios
stop_dev() {
    print_info "Deteniendo servicios..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Servicios detenidos"
}

# Función: Ver logs
show_logs() {
    docker-compose -f docker-compose.dev.yml logs -f
}

# Función: Ver logs solo backend
show_backend_logs() {
    docker-compose -f docker-compose.dev.yml logs -f backend
}

# Función: Reiniciar backend
restart_backend() {
    print_info "Reiniciando backend..."
    docker-compose -f docker-compose.dev.yml restart backend
    print_success "Backend reiniciado"
}

# Función: Limpiar todo
clean_all() {
    print_warning "Esto eliminará contenedores, volúmenes y cache de Docker"
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Limpiando..."
        docker-compose -f docker-compose.dev.yml down -v
        docker builder prune -a -f
        print_success "Limpieza completada"
    else
        print_info "Cancelado"
    fi
}

# Función: Verificar servicios
check_services() {
    print_info "Verificando servicios..."
    
    # Verificar backend
    if curl -s http://localhost:4000/api/health > /dev/null; then
        print_success "Backend (http://localhost:4000) está corriendo"
        
        # Intentar verificar conexión a BD
        if curl -s http://localhost:4000/api/db-test > /dev/null; then
            print_success "Backend conectado a la base de datos PostgreSQL externa"
        else
            print_warning "Backend no puede conectar a la base de datos"
            print_info "Verifica tu DATABASE_URL en docker-compose.dev.yml"
        fi
    else
        print_error "Backend no responde en http://localhost:4000"
    fi
    
    # Nota sobre BD externa
    print_info "📌 Usando base de datos PostgreSQL externa (no gestionada por docker-compose)"
}

# Función: Ejecutar migraciones
run_migrations() {
    print_warning "Las migraciones deben ejecutarse en tu base de datos PostgreSQL externa"
    print_info "Las migraciones están en: backend/migrations/"
    echo ""
    print_info "Para ejecutarlas, usa uno de estos métodos:"
    echo ""
    echo "  1. Conectar a tu BD y ejecutar manualmente:"
    echo "     psql -h localhost -U tu_usuario -d futbol_clinic -f backend/migrations/001_init.sql"
    echo ""
    echo "  2. Si tu BD está en Docker, usa:"
    echo "     docker exec -i nombre_contenedor_bd psql -U usuario -d futbol_clinic < backend/migrations/001_init.sql"
    echo ""
    echo "  3. Usar pgAdmin o cualquier cliente PostgreSQL"
    echo ""
}

# Función: Conectar a la base de datos
connect_db() {
    print_warning "Debes conectarte a tu base de datos PostgreSQL externa directamente"
    echo ""
    print_info "Opciones para conectar:"
    echo ""
    echo "  1. Si tu BD está en Docker:"
    echo "     docker exec -it nombre_contenedor_bd psql -U usuario -d futbol_clinic"
    echo ""
    echo "  2. Si tu BD está en localhost:"
    echo "     psql -h localhost -U usuario -d futbol_clinic"
    echo ""
    echo "  3. Usar pgAdmin en http://localhost:5050 (si lo tienes instalado)"
    echo ""
    echo "  4. Usar cualquier cliente PostgreSQL (DBeaver, TablePlus, etc.)"
    echo ""
}

# Función: Mostrar estado
show_status() {
    print_info "Estado de los servicios:"
    docker-compose -f docker-compose.dev.yml ps
}

# Función: Reconstruir backend
rebuild_backend() {
    print_info "Reconstruyendo backend..."
    docker-compose -f docker-compose.dev.yml build --no-cache backend
    print_success "Backend reconstruido"
}

# Función: Mostrar ayuda
show_help() {
    echo "Uso: ./dev.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start         - Iniciar servicios (con logs)"
    echo "  start-bg      - Iniciar servicios en background"
    echo "  stop          - Detener servicios"
    echo "  restart       - Reiniciar backend"
    echo "  logs          - Ver logs de todos los servicios"
    echo "  logs-backend  - Ver logs solo del backend"
    echo "  status        - Ver estado de los servicios"
    echo "  check         - Verificar que los servicios funcionan"
    echo "  clean         - Limpiar todo (contenedores, volúmenes, cache)"
    echo "  rebuild       - Reconstruir backend sin cache"
    echo "  migrations    - Ver instrucciones para ejecutar migraciones"
    echo "  db            - Ver instrucciones para conectar a la BD"
    echo "  help          - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./dev.sh start        # Iniciar y ver logs"
    echo "  ./dev.sh start-bg     # Iniciar en background"
    echo "  ./dev.sh check        # Verificar que todo funciona"
    echo "  ./dev.sh logs-backend # Ver logs del backend"
}

# Parsear comando
case "$1" in
    start)
        start_dev
        ;;
    start-bg)
        start_dev_bg
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_backend
        ;;
    logs)
        show_logs
        ;;
    logs-backend)
        show_backend_logs
        ;;
    status)
        show_status
        ;;
    check)
        check_services
        ;;
    clean)
        clean_all
        ;;
    rebuild)
        rebuild_backend
        ;;
    migrations)
        run_migrations
        ;;
    db)
        connect_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            print_warning "No especificaste ningún comando"
        else
            print_error "Comando desconocido: $1"
        fi
        echo ""
        show_help
        exit 1
        ;;
esac

