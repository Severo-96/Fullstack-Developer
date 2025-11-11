puts 'Seeding users...'

seed_users = [
  {
    full_name: 'Administrador Padrão',
    email: 'admin@example.com',
    password: 'admin123',
    role: :admin
  },
  {
    full_name: 'Usuário Padrão',
    email: 'user@example.com',
    password: 'user123',
    role: :non_admin
  }
]

seed_users.each do |attributes|
  user = User.find_or_initialize_by(email: attributes[:email])
  if user.persisted?
    user.update!(attributes)
    puts "Atualizado: #{attributes[:email]}"
  else
    User.create!(attributes)
    puts "Criado: #{attributes[:email]}"
  end
end

puts 'Seed concluído.'
