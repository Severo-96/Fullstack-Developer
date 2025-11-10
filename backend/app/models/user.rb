class User < ApplicationRecord
  enum :role, {
    non_admin: 0,
    admin: 1
  }

  has_secure_password
  has_one_attached :avatar_image

  validates :full_name, presence: true
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

  after_commit :broadcast_counts

  def self.count_by_role
    counts = group(:role).count

    {
      non_admin: counts.fetch('non_admin', 0),
      admin: counts.fetch('admin', 0),
      total: counts.values.sum
    }
  end

  def avatar_image_url
    return unless avatar_image.attached?

    Rails.application.routes.url_helpers.url_for(avatar_image)
  end

  private

  def broadcast_counts
    UsersCountBroadcastJob.perform_later
  end
end
